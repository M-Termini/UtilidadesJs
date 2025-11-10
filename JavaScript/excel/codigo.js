const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

const $table = $('table');
const $head = $('thead');
const $body = $('tbody');

const ROWS = 10;
const COLUMNS = 3;
const FIRST_CHAR_CODE = 65; // ASCII code for 'A'
let selectedColumn = null;

//Funcion de utilidad para crear un array de longitud `length` con valores del 0 al length-1
const range = length => Array.from({ length }, (_, i) => i);
const getColumn = i => String.fromCharCode(FIRST_CHAR_CODE + i);

let STATE = range(COLUMNS).map(i => range(ROWS).map(j => ({computedValue: j, value: j})));
console.log(STATE);

function updateCell ({ x , y , value }) {
    
    const newState = structuredClone(STATE);
    const constants = generateCellConst(newState);
    console.log(constants);
    const cell = newState[x][y];
    const computedValue = computeValue(value, constants);
    cell.computedValue = computedValue; // --> span
    cell.value = value; // --> input

    newState[x][y] = cell;

    computeAllCells(newState, generateCellConst(newState));

    STATE = newState;

    renderSheet();
}

function computeValue (val, constants){
    if (typeof val == 'number') return val;
    if (!val.startsWith('=')) return val;
    const formula = val.slice(1);
    console.log(formula);
    let computed;

    try {
        computed = eval(`(() =>{
            ${constants}
            return ${formula};
            })();`);
    } catch (e) {
        computed= `ERROR: ${e.message}`;
    }

    return computed;
}

function generateCellConst(cells) {
    return cells.map((row, x) =>{
        return row.map((cell, y) => {
            const letter = getColumn(x); // 'A', 'B', 'C', ...
            const cellId = `${letter}${y + 1}`; // 'A1', 'B2', ...
            if (cell.value == "") return `const ${cellId} = 0;`; // IMPORTANTE: Si la celda está vacía, la tratamos como 0 para evitar errores en las fórmulas
            return `const ${cellId} = ${cell.computedValue};`
        }).join('\n')
    }).join('\n');
}

function computeAllCells (cells, constants) {
    console.log('Recalculando todas las celdas...');
    cells.forEach((rows, x) => {
        rows.forEach((cell, y) => {
            const computedValue = computeValue(cell.value, constants);
            cell.computedValue = computedValue;
        });
    });
}


const renderSheet = () => {
    const headerHTML = `<tr>
            <th></th>
            ${range(COLUMNS).map(i => `<th>${getColumn(i)}</th>`).join('')}
        </tr>`;
    
    $head.innerHTML = headerHTML

    const bodyHTML = range(ROWS).map(row => {
        return `<tr>
        <td>${row + 1}</td>
        ${range(COLUMNS).map(column => `
            <td data-x="${column}" data-y="${row}">
            <span>${STATE[column][row].computedValue}</span>
            <input type="text" value="${STATE[column][row].value}" />
            </td>
        `).join('')}
    </tr>`;
    }).join('');

    $body.innerHTML = bodyHTML
}

$head.addEventListener('click', e => {
    const th = e.target.closest('th');
    if (!th) return;

    selectedColumn = [...th.parentNode.children].indexOf(th) -1;
    if (selectedColumn < 0) return;

    $$('.selected').forEach(th => th.classList.remove('selected')); //Quita la clase de todos los th

    th.classList.add('selected'); //Cambia la clase del th seleccionado
    $$(`tr td:nth-child(${selectedColumn + 2})`).forEach(td => {td.classList.add('selected')}); //Cambia la clase de las celdas de la columna seleccionada
});

document.addEventListener('keydown', e => {
    if (e.key == 'Backspace' && selectedColumn !== null) {
        range(ROWS).forEach(row => {
            updateCell({x: selectedColumn, y: row, value: ""});
        })
        renderSheet();
        selectedColumn = null;
    }
});

$body.addEventListener('click', e => {
    const td = e.target.closest('td');
    if (!td) return;

    const {x, y } = td.dataset;
    const input = td.querySelector('input');
    const span = td.querySelector('span');

    //Dejar el cursor al final del valor de input (no es necesario, pero es más cómodo)
    const end = input.value.length;
    input.setSelectionRange(end, end);
    input.focus();

    input,addEventListener('keydown', e => {
        if (e.key == 'Enter') input.blur();
    });

    input.addEventListener('blur', () => {
        console.log({value: input.value, state: STATE[x][y].value});

        if (input.value === STATE[x][y].value) return;

        // Actualizar el estado
        updateCell({x, y, value: input.value});
    } , {once: true})

    document.addEventListener('copy', e => {
        e.preventDefault();
        if (selectedColumn == null) return;
        const rowsValues = range(ROWS).map(row => STATE[selectedColumn][row].computedValue);
        e.clipboardData.setData('text/plain', rowsValues.join('\n'));
    })

});
renderSheet()