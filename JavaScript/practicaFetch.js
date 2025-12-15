console.log("Iniciando practica");

let informacion = {};
const url = "https://jsonplaceholder.typicode.com/users";

async function fetchApi(url, method = "GET", data= null) {
    let options = {method, headers: {'Content-Type': 'application/json'}};
    if (data)  options.body = JSON.stringify(data);
    const res = await fetch (url, options);
    let body = {};

    try { body = await res.json();} catch (e) {console.error(e);}

    if (!res.ok) throw new Error (body.error || "Error en la operación");

    return body;
}
fetchApi (url)
    .then(data => {informacion = data;})
    .then(() => console.log (informacion[0].address));

