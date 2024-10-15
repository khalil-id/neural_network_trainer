
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






const title = document.getElementById('title');
const sidebar = document.getElementById('sidebar');
const form = document.getElementById('training-form');
const dataFileGroup = document.getElementById('dataFileGroup');
const numLayersGroup = document.getElementById('numLayersGroup');
const neuronsPerLayerGroup = document.getElementById('neuronsPerLayerGroup');
const activationFunctionGroup = document.getElementById('activationFunctionGroup');
const epochsGroup = document.getElementById('epochsGroup');
const learningRateGroup = document.getElementById('learningRateGroup');
const submit = document.getElementById('submit');

// Show title
setTimeout(() => {
    title.style.opacity = '1';
    title.style.transform = 'translateY(0)';
}, 300); // Delay for title

// Show card after title
setTimeout(() => {
    sidebar.classList.add('show');
    dataFileGroup.style.display = 'block'; // Show first field
    dataFileGroup.querySelector('input').focus(); // Focus on first field
    setTimeout(() => {
        dataFileGroup.querySelector('input').style.opacity = '1';
        dataFileGroup.querySelector('input').style.transform = 'translateY(0)';
    }, 100);
}, 600); // Delay for card

// Event listener for the first field (Data File)
dataFileGroup.querySelector('input').addEventListener('change', function() {
    numLayersGroup.style.display = 'block'; // Show next field
    numLayersGroup.querySelector('input').style.opacity = '1';
    numLayersGroup.querySelector('input').style.transform = 'translateY(0)';
    setTimeout(() => {
        numLayersGroup.querySelector('input').focus(); // Focus on next field
    }, 100);
});

// Event listener for the number of layers
numLayersGroup.querySelector('input').addEventListener('change', function() {
    neuronsPerLayerGroup.style.display = 'block'; // Show next field
    neuronsPerLayerGroup.querySelector('input').style.opacity = '1';
    neuronsPerLayerGroup.querySelector('input').style.transform = 'translateY(0)';
    setTimeout(() => {
        neuronsPerLayerGroup.querySelector('input').focus(); // Focus on next field
    }, 100);
});

// Event listener for the neurons per layer
neuronsPerLayerGroup.querySelector('input').addEventListener('change', function() {
    activationFunctionGroup.style.display = 'block'; // Show next field
    activationFunctionGroup.querySelector('select').style.opacity = '1';
    activationFunctionGroup.querySelector('select').style.transform = 'translateY(0)';
    setTimeout(() => {
        activationFunctionGroup.querySelector('select').focus(); // Focus on next field
    }, 100);
});

// Event listener for the activation function
activationFunctionGroup.querySelector('select').addEventListener('change', function() {
    epochsGroup.style.display = 'block'; // Show next field
    epochsGroup.querySelector('input').style.opacity = '1';
    epochsGroup.querySelector('input').style.transform = 'translateY(0)';
    setTimeout(() => {
        epochsGroup.querySelector('input').focus(); // Focus on next field
    }, 100);
});

// Event listener for the number of epochs
epochsGroup.querySelector('input').addEventListener('change', function() {
    learningRateGroup.style.display = 'block'; // Show next field
    learningRateGroup.querySelector('input').style.opacity = '1';
    learningRateGroup.querySelector('input').style.transform = 'translateY(0)';
    setTimeout(() => {
        learningRateGroup.querySelector('input').focus(); // Focus on next field
    }, 100);
});

// Event listener for the learning rate
learningRateGroup.querySelector('input').addEventListener('change', function() {
    submit.style.display = 'block'; // Show submit button
    submit.style.opacity = '1'; // Fade in submit button
    submit.style.transform = 'translateY(0)'; // Move to original position
    setTimeout(() => {
        submit.focus(); // Focus on submit button
    }, 100);
});

