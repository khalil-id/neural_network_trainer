from flask import Flask, request, jsonify, render_template, send_file
import pandas as pd
import tensorflow as tf
import os

app = Flask(__name__)

# Route pour la page d'accueil
@app.route('/')
def index():
    return render_template('index.html')

# Fonction pour construire le modèle
def build_model(layers, neurons, activation):
    model = tf.keras.Sequential()
    for _ in range(layers):
        model.add(tf.keras.layers.Dense(neurons, activation=activation))
    model.add(tf.keras.layers.Dense(1, activation='sigmoid'))  # Couche de sortie pour la classification binaire
    return model

# Fonction pour compiler le modèle
def compile_model(model, learning_rate):
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
                  loss='binary_crossentropy',
                  metrics=['accuracy'])
    
# Route pour entraîner le modèle
@app.route('/train', methods=['POST'])
def train_model():
    data_file = request.files['data']
    df = pd.read_csv(data_file)
    
    # Supposons que la dernière colonne est la variable cible
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]

    layers = int(request.form['layers'])
    neurons = int(request.form['neurons'])
    activation = request.form['activation']
    learning_rate = float(request.form['lr'])
    epochs = int(request.form['epochs'])
    batch_size = int(request.form['batch_size'])

    model = build_model(layers, neurons, activation)
    compile_model(model, learning_rate)

    history = model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0)

    return jsonify({'accuracy': history.history['accuracy'], 'loss': history.history['loss']})

# Route pour télécharger le modèle
@app.route('/download_model', methods=['GET'])
def download_model():
    model_path = os.path.join('models', 'model.h5')
    if os.path.exists(model_path):
        return send_file(model_path, as_attachment=True)
    else:
        return jsonify({'error': 'Modèle non trouvé.'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=8000)
