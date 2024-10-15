
document.addEventListener('DOMContentLoaded', function() {
    const trainButton = document.getElementById('trainButton');
    const trainingCard = document.getElementById('training-form');
    const results = document.getElementById('results');

    trainButton.addEventListener('click', function() {
        trainingCard.style.display = 'none';
        results.style.display = 'block';
    });
});
document.getElementById('training-form').onsubmit = async function (e) {
    e.preventDefault();  // Prevent the form from submitting the traditional way

    // Show the loading spinner
    const loadingElement = document.getElementById('loading');
    loadingElement.classList.remove('hidden');
    loadingElement.style.animation = 'spin 1s linear infinite';

    // Clear any previous message or graphs
    const messageElement = document.getElementById('message');
    messageElement.innerHTML = "";
    messageElement.classList.remove('success', 'error');
    Plotly.purge('accuracy-plot');
    Plotly.purge('loss-plot');

    // Prepare the form data for submission
    let formData = new FormData(document.getElementById('training-form'));

    try {
        // Make an asynchronous POST request to the /train endpoint
        const response = await fetch('/train', {
            method: 'POST',
            body: formData
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error('Failed to train the model');
        }

        // Parse the JSON response
        const data = await response.json();
        const accuracy = data.accuracy;
        const loss = data.loss;

        // Plot Accuracy
        var accuracy_trace = {
            x: Array.from(Array(accuracy.length).keys()),  // Epoch numbers
            y: accuracy,
            mode: 'lines+markers',
            name: 'Accuracy',
            line: {
                shape: 'spline',
                color: 'rgba(255, 99, 132, 0.7)',
                width: 3
            },
            marker: {
                color: 'rgba(255, 99, 132, 1)',
                size: 6
            }
        };

        var accuracy_layout = {
            title: 'Training Accuracy',
            xaxis: { title: 'Epoch', showgrid: false },
            yaxis: { title: 'Accuracy', showgrid: true, gridcolor: 'rgba(255, 99, 132, 0.2)' },
            plot_bgcolor: '#222',
            paper_bgcolor: '#000',
            font: {
                color: '#fff'
            }
        };

        Plotly.newPlot('accuracy-plot', [accuracy_trace], accuracy_layout, {responsive: true});

        // Plot Loss
        var loss_trace = {
            x: Array.from(Array(loss.length).keys()),  // Epoch numbers
            y: loss,
            mode: 'lines+markers',
            name: 'Loss',
            line: {
                shape: 'spline',
                color: 'rgba(54, 162, 235, 0.7)',
                width: 3
            },
            marker: {
                color: 'rgba(54, 162, 235, 1)',
                size: 6
            }
        };

        var loss_layout = {
            title: 'Training Loss',
            xaxis: { title: 'Epoch', showgrid: false },
            yaxis: { title: 'Loss', showgrid: true, gridcolor: 'rgba(54, 162, 235, 0.2)' },
            plot_bgcolor: '#222',
            paper_bgcolor: '#000',
            font: {
                color: '#fff'
            }
        };

        Plotly.newPlot('loss-plot', [loss_trace], loss_layout, {responsive: true});

        // Display success message
        messageElement.classList.add('success');
        messageElement.innerHTML = "Training completed successfully!";
        messageElement.style.animation = 'fadeIn 1s ease-in-out';

    } catch (error) {
        // Display error message
        messageElement.classList.add('error');
        messageElement.innerHTML = "Error: " + error.message;
        messageElement.style.animation = 'fadeIn 1s ease-in-out';
    } finally {
        // Hide the loading spinner no matter the outcome
        loadingElement.classList.add('hidden');
    }
};
