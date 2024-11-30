export const initLogin = async (container: HTMLElement) => {
    console.log('initializing Login');

    enablePasswordToggle(container);
};

const enablePasswordToggle = (container: HTMLElement) => {
    const toggle = container.querySelector('#togglePassword');
    const passwordField = container.querySelector('#password');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            const type = passwordField?.getAttribute('type') === 'text' ? 'password' : 'text';
            passwordField?.setAttribute('type', type);
        });
    }
}



