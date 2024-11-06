$(document).ready(function() {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");
        return false;
    });

    $('#trainButton').on('click', function() {
        $('#training-form').submit(); // Manually submit the form
    });

    let currentModelType = 'classification';
    // Initialize model type selection
    $('#model-type').on('change', function() {
        currentModelType = $(this).val();
        // Hide all result containers initially
        hideAllGraphs();
    });

    // Hide all graph containers
    function hideAllGraphs() {
        $('#accuracy-curve').hide();
        $('#loss-curve').hide();
        $('#confusion-matrix').hide();
        $('#roc-curve').hide();
        $('#mae-curve').hide();
        $('#mse-curve').hide();
    }

    // Training form submission
    $('#training-form').on('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        const formData = new FormData(this); // Create FormData object from the form

        // Show loading spinner
        $('#loading').removeClass('hidden');
        $('#message').hide();
        hideAllGraphs();

        $.ajax({
            url: '/train', // The endpoint to send the request to
            type: 'POST',
            data: formData,
            contentType: false, // Don't set any content type header
            processData: false, // Don't process the data into a query string
            success: function(response) {
                $('#loading').addClass('hidden'); // Hide loading spinner

                // Show common graphs
                $('#loss-curve').show();
                plotLossCurve(response.loss); // Plot the results

                if (currentModelType === 'classification') {
                    // Show classification-specific graphs
                    $('#accuracy-curve').show();
                    $('#confusion-matrix').show();
                    $('#roc-curve').show();
                    
                    plotAccuracyCurve(response.accuracy);
                    plotConfusionMatrix(response.confusion_matrix);
                    plotROCCurve(response.roc_curve);
                } else {
                    // Show regression-specific graphs
                    $('#mae-curve').show();
                    $('#mse-curve').show();
                    
                    plotMAE(response.mean_absolute_error);
                    plotMSE(response.mean_squared_error);
                }
            },
            error: function(xhr) {
                $('#loading').addClass('hidden');
                $('#message').text(xhr.responseJSON.error).show();
            }
        });
    });

    // Plot Loss Curve (common for both types)
    // Common plotting functions
    function plotLossCurve(lossData) {
        const ctx = document.getElementById('loss-chart');
        if (!ctx) return;
        
        if (window.lossChart) {
            window.lossChart.destroy();
        }
        window.lossChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({ length: lossData.length }, (_, i) => i + 1),
                datasets: [{
                    label: 'Loss',
                    data: lossData,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Classification specific plotting functions
    function plotAccuracyCurve(accuracyData) {
        const ctx = document.getElementById('accuracy-chart');
        if (!ctx) return;
        
        if (window.accuracyChart) {
            window.accuracyChart.destroy();
        }
        window.accuracyChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({ length: accuracyData.length }, (_, i) => i + 1),
                datasets: [{
                    label: 'Accuracy',
                    data: accuracyData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Training Accuracy Over Time'
                    }
                }
            }
        });
    }

    function plotConfusionMatrix(confusionMatrix) {
        const ctx = document.getElementById('confusion-chart');
        if (!ctx) return;
    
        if (window.confusionChart) {
            window.confusionChart.destroy();
        }
    
        // Labels for the confusion matrix axes
        const labels = ['Negative', 'Positive'];
    
        // Transform the confusion matrix into an array of objects with x, y, and v properties
        const matrixData = [];
        for (let i = 0; i < confusionMatrix.length; i++) {
            for (let j = 0; j < confusionMatrix[i].length; j++) {
                matrixData.push({
                    x: j, // Predicted
                    y: confusionMatrix.length - 1 - i, // Actual (reversed for proper display)
                    v: confusionMatrix[i][j]
                });
            }
        }
    
        // Define the maximum value for color scaling
        const max = Math.max(...matrixData.map(d => d.v));
    
        const data = {
            datasets: [{
                label: 'Confusion Matrix',
                data: matrixData,
                backgroundColor(context) {
                    const value = context.raw.v;
                    const alpha = max ? value / max : 0; // Calculate opacity based on value
                    return `rgba(75, 192, 192, ${alpha})`; // Color based on value
                },
                borderColor: 'white',
                borderWidth: 1,
                width: ({ chart }) => (chart.chartArea || {}).width / 2,
                height: ({ chart }) => (chart.chartArea || {}).height / 2
            }]
        };
    
        window.confusionChart = new Chart(ctx.getContext('2d'), {
            type: 'matrix',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        type: 'category',
                        labels: labels,
                        title: {
                            display: true,
                            text: 'Predicted'
                        }
                    },
                    y: {
                        type: 'category',
                        labels: labels.reverse(),
                        title: {
                            display: true,
                            text: 'Actual'
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const { x, y, v } = context.raw;
                                return `${labels[y]} predicted as ${labels[x]}: ${v}`;
                            }
                        }
                    }
                }
            }
        });
    }
      

    function plotROCCurve(rocData) {
        const ctx = document.getElementById('roc-chart');
        if (!ctx) return;
        
        if (window.rocChart) {
            window.rocChart.destroy();
        }

        // Calculate AUC
        let auc = 0;
        for (let i = 1; i < rocData.fpr.length; i++) {
            auc += (rocData.fpr[i] - rocData.fpr[i-1]) * (rocData.tpr[i] + rocData.tpr[i-1]) / 2;
        }
        auc = Math.round(auc * 1000) / 1000;

        window.rocChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: rocData.fpr,
                datasets: [
                    {
                        label: `ROC Curve (AUC = ${auc})`,
                        data: rocData.tpr,
                        borderColor: 'rgb(153, 102, 255)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Random Classifier',
                        data: rocData.fpr, // diagonal line
                        borderColor: 'rgb(169, 169, 169)',
                        borderDash: [5, 5],
                        tension: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'False Positive Rate'
                        },
                        beginAtZero: true,
                        max: 1
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'True Positive Rate'
                        },
                        beginAtZero: true,
                        max: 1
                    }
                },
                plugins: {
                    title: {
                        display: true,
                    }
                }
            }
        });
    }

    let maeHistory = [];
    function onEpochEnd(mae) {
        maeHistory.push(mae);
        // Update the chart with all accumulated data
        plotMAE(maeHistory);
    }

    function plotMAE(maeData, valMaeData) {
        const ctx = document.getElementById('mae-chart');
        if (!ctx) return;
        
        if (window.maeChart) {
            window.maeChart.destroy();
        }
        window.maeChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({ length: maeData.length }, (_, i) => i + 1),
                datasets: [
                    {
                        label: 'Training MAE',
                        data: maeData,
                        borderColor: 'rgb(255, 159, 64)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Validation MAE',
                        data: valMaeData,
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'MAE Value'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Epoch'
                        }
                    }
                }
            }
        });
    }
    
    function plotMSE(mseData, valMseData) {
        const ctx = document.getElementById('mse-chart');
        if (!ctx) return;
        
        if (window.mseChart) {
            window.mseChart.destroy();
        }
        window.mseChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({ length: mseData.length }, (_, i) => i + 1),
                datasets: [
                    {
                        label: 'Training MSE',
                        data: mseData,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Validation MSE',
                        data: valMseData,
                        borderColor: 'rgb(153, 102, 255)',
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'MSE Value'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Epoch'
                        }
                    }
                }
            }
        });
    }

    // Download model button handler
    $('#downloadModel').on('click', function() {
        window.location.href = '/models';
    });

});