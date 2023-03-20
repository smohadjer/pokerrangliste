const fetchData = () => {
  fetch('/api/fetch.js')
  .then((response) => response.json())
  .then((json) => {
      const data = json.data;
      document.getElementById('svg').hidden = true;

      if (data.length > 0) {
          let html = `<p>${data.length} entries were found.</p>`;
          html += '<table><tr><th>First Name</th><th>Last Name</th><th>Age</th></tr>';
          data.forEach((item) => {
            html += `<tr><td>${item.firstname}</td><td>${item.lastname}</td><td>${item.age}</td></tr>`
          });
          html += '</table>';
          document.getElementById('test').innerHTML = html;
      } else {
          document.getElementById('test').innerHTML = 'No data found!';
      }
  });
}
const form = document.querySelector('form#register');
const formDelete = document.querySelector('form#delete');

fetchData();

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const queryString = new URLSearchParams(formData).toString()
  const http = new XMLHttpRequest();
  http.open(form.getAttribute('method'), form.getAttribute('action'));
  http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == 200) {
          console.log(http.responseText);

          fetchData();
      }
  }
  http.send(queryString);
  form.reset();
  document.getElementById('test').innerHTML = '';
  document.getElementById('svg').hidden = false;
});

formDelete.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(formDelete);
  const queryString = new URLSearchParams(formData).toString()
  const http = new XMLHttpRequest();
  http.open(formDelete.getAttribute('method'), formDelete.getAttribute('action'));
  http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == 200) {
          console.log(http.responseText);

          fetchData();
      }
  }
  http.send(queryString);
  formDelete.reset();
  document.getElementById('test').innerHTML = '';
  document.getElementById('svg').hidden = false;
});
