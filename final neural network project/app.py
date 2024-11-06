from flask import Flask, request, jsonify, render_template, send_file
import pandas as pd
import tensorflow as tf
import os
from sklearn.metrics import confusion_matrix, roc_curve, auc, mean_squared_error, mean_absolute_error
from sklearn.model_selection import train_test_split
import numpy as np


app = Flask(__name__)

# Route for the homepage
@app.route('/')
def index():
    return render_template('index.html')

# Function to build the model
def build_model(layers, neurons, activation, is_classification):
    model = tf.keras.Sequential()
    for _ in range(layers):
        model.add(tf.keras.layers.Dense(neurons, activation=activation))
    # Output layer based on the type of problem
    if is_classification:
        model.add(tf.keras.layers.Dense(1, activation='sigmoid'))  # Output layer for binary classification
    else:
        model.add(tf.keras.layers.Dense(1))  # Output layer for regression (no activation)
    return model

# Function to compile the model
def compile_model(model, learning_rate, is_classification):
    loss_function = 'binary_crossentropy' if is_classification else 'mean_squared_error'
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
                  loss=loss_function,
                  metrics=['accuracy'] if is_classification else ['mae'])

@app.route('/train', methods=['POST'])
def train_model():
    if 'data' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    data_file = request.files['data']
    if not data_file:
        return jsonify({'error': 'No file selected'}), 400

    df = pd.read_csv(data_file)

    # Assuming the last column is the target variable
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]

    layers = int(request.form['layers'])
    neurons = int(request.form['neurons'])
    activation = request.form['activation']
    learning_rate = float(request.form['lr'])
    epochs = int(request.form['epochs'])
    batch_size = int(request.form['batch_size'])
    model_type = request.form['model-type']  # Get the model type from the form
    is_classification = (model_type == 'classification')

    model = build_model(layers, neurons, activation, is_classification)
    compile_model(model, learning_rate, is_classification)

    # Split data into train and test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    history = model.fit(
        X_train, y_train,
        epochs=epochs,
        batch_size=batch_size,
        validation_data=(X_test, y_test)
    )
    model.save('models/model.h5')
    
    # Initialize response with loss
    response = {
        'loss': history.history['loss'],
    }

    # Generate predictions
    if is_classification:
        y_pred = (model.predict(X_test) > 0.5).astype("int32")
        response['accuracy'] = history.history['accuracy']
        response['confusion_matrix'] = confusion_matrix(y_test, y_pred).tolist()

        # ROC and AUC
        y_pred_proba = model.predict(X_test).ravel()
        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        response['roc_curve'] = {'fpr': fpr.tolist(), 'tpr': tpr.tolist(), 'auc': auc(fpr, tpr)}
    else:  # Regression
        y_pred = model.predict(X_test).ravel()
        
        # Get training history for MAE and MSE
        mae_values = history.history['mae']
        mse_values = history.history['mse']
        
        # Add validation metrics
        val_mae_values = history.history['val_mae']
        val_mse_values = history.history['val_mse']
        
        # Add all metrics to response
        response.update({
            'mean_absolute_error': mae_values,
            'mean_squared_error': mse_values,
            'val_mean_absolute_error': val_mae_values,
            'val_mean_squared_error': val_mse_values
        })
        
    return jsonify(response)

def compile_model(model, learning_rate, is_classification):
    if is_classification:
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
    else:
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
            loss='mean_squared_error',
            metrics=['mae', 'mse']  # Track both MAE and MSE
        )

# Route to download the model
@app.route('/download_model', methods=['GET'])
def download_model():
    model_path = os.path.join('models', 'model.h5')
    if os.path.exists(model_path):
        return send_file(model_path, as_attachment=True)
    else:
        return jsonify({'error': 'Model not found.'}), 404

if __name__ == '__main__':
    app.run(port=8001)
