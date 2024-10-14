export function ajaxifyForms(form: HTMLFormElement) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.target;
        if (form && form instanceof HTMLFormElement) {
            form.classList.add('loading');
            const formData = new FormData(form);
            var object: { [key: string]: FormDataEntryValue; } = {};
            for (const pair of formData.entries()) {
                console.log(pair[0], pair[1]);
                object[pair[0]] = pair[1];
            }
            fetch(form.action, {
                method: form.method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(object)
            })
            .then(response => response.json())
            .then((res) => {
                form.classList.remove('loading');
                // update state
                console.log(res);
            })
        }
    });
}
