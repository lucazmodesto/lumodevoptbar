// Configuração do Firebase
 var firebaseConfig = {
            apiKey: "AIzaSyCbQ14Lb19nGbepMVxtlZ0n6sfbQkNXFH4",
            authDomain: "otimizador-a900f.firebaseapp.com",
            databaseURL: "https://otimizador-a900f-default-rtdb.firebaseio.com",
            projectId: "otimizador-a900f",
            storageBucket: "otimizador-a900f.appspot.com",
            messagingSenderId: "173721272915",
            appId: "1:173721272915:web:fd7208796ceedaf94a7ca6",
            measurementId: "G-QMCSB5YYXV"
        };
        firebase.initializeApp(firebaseConfig);

// Função de login
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login bem-sucedido
            var user = userCredential.user;
            alert('Login realizado com sucesso!');
            // Redirecionar para a página index.html na pasta Source
            window.location.href = 'Source/index.html';
        })
        .catch((error) => {
            // Erro ao fazer login
            var errorMessage = error.message;
            document.getElementById('error-message').innerText = errorMessage;
        });
});
