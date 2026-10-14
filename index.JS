const form = document.querySelector('#login-form');
const username = document.querySelector('#username');
const password = document.querySelector('#password');
const message = document.querySelector('#login-message');
const toggle = document.querySelector('#toggle-password');
const loginScreen = document.querySelector('#login-screen');
const appScreen = document.querySelector('#app-screen');
const appTitle = document.querySelector('#app-title');

toggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
  toggle.setAttribute('aria-pressed', String(visible));
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  // Acesso de demonstração. A autenticação real deve ser validada no servidor.
  if (username.value.trim() === 'pedro' && password.value === '1234') {
    message.textContent = '';
    loginScreen.hidden = true;
    appScreen.hidden = false;
    password.value = '';
    document.title = 'PULSE — Área do aluno';
    window.scrollTo(0, 0);
    appTitle.focus();
  } else {
    message.textContent = 'Usuário ou senha incorretos. Tente novamente.';
    password.setAttribute('aria-invalid', 'true');
    password.setAttribute('aria-describedby', 'login-message');
    password.focus();
  }
});

form.addEventListener('input', () => {
  message.textContent = '';
  password.removeAttribute('aria-invalid');
  password.removeAttribute('aria-describedby');
});

