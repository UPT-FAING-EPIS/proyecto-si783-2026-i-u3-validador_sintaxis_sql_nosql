/**
 * app.js
 * Lógica principal del SQL/NoSQL Syntax Validator.
 * Versión limpia: sin características de UI avanzadas de errores.
 */

const API_BASE = window.location.origin + '/api';
const MAX_HISTORY = 50;

const state = {
   editor: null,
   language: 'sql',
   theme: 'dark',
   history: JSON.parse(localStorage.getItem('validator-history') || '[]'),
   stats: JSON.parse(localStorage.getItem('validator-stats') || '{"validations":0,"valid":0,"invalid":0}'),
   examples: { sql: [], nosql: [] },
   isValidating: false
};

function initMonaco() {
  require.config({
    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
  });

  require(['vs/editor/editor.main'], function () {
    monaco.editor.defineTheme('validator-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'delimiter', foreground: 'd4d4d4' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2d2e',
        'editorCursor.foreground': '#aeafad',
        'editor.selectionBackground': '#264f78',
        'editorLineNumber.foreground': '#858585',
        'editorGutter.background': '#1e1e1e'
      }
    });

    monaco.editor.defineTheme('validator-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000ff', fontStyle: 'bold' },
        { token: 'string', foreground: 'a31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#333333',
        'editor.lineHighlightBackground': '#f5f5f5',
        'editorLineNumber.foreground': '#999999'
      }
    });

    state.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      value: getDefaultQuery('sql'),
      language: 'sql',
      theme: state.theme === 'dark' ? 'validator-dark' : 'validator-light',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      lineNumbers: 'on',
      minimap: { enabled: false },
      wordWrap: 'off',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      roundedSelection: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      suggest: { showKeywords: true },
      padding: { top: 10 }
    });

    registerSQLCompletions();

    state.editor.onDidChangeCursorPosition(function (e) {
      document.getElementById('cursor-position').textContent =
        'Ln ' + e.position.lineNumber + ', Col ' + e.position.column;
    });

state.editor.onDidChangeModelContent(function () {
       const content = state.editor.getValue();
       document.getElementById('char-count').textContent = content.length + ' caracteres';
       document.getElementById('stat-lines').textContent = state.editor.getModel().getLineCount();
     });

    state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, doValidate);

    document.getElementById('stat-lines').textContent = state.editor.getModel().getLineCount();
    document.getElementById('char-count').textContent = state.editor.getValue().length + ' caracteres';

    loadExamples();
    updateStats();
    renderHistory();
    updateClock();
    setInterval(updateClock, 30000);
  });
}

function registerSQLCompletions() {
  monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: function () {
      var keywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES',
        'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP',
        'ALTER', 'INDEX', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
        'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'ASC', 'DESC',
        'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'AS', 'AND',
        'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE',
        'EXISTS', 'UNION', 'ALL', 'COUNT', 'SUM', 'AVG',
        'MAX', 'MIN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CASCADE',
        'VARCHAR', 'INT', 'INTEGER', 'TEXT', 'DATE', 'TIMESTAMP',
        'BOOLEAN', 'FLOAT', 'DECIMAL', 'NOW', 'CURRENT_TIMESTAMP'
      ];
      return {
        suggestions: keywords.map(function (kw) {
          return {
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            detail: 'SQL Keyword'
          };
        })
      };
    }
  });
}

function getDefaultQuery(type) {
  if (type === 'sql') {
    return 'SELECT *\nFROM usuarios\nWHERE edad > 18\nORDER BY nombre ASC;';
  }
  return 'db.usuarios.find({ activo: true, edad: { $gte: 18 } })';
}

async function doValidate() {
   if (state.isValidating) return;

   var query = state.editor.getValue().trim();
   if (!query) {
     showToast('Escribe una consulta antes de validar.', 'info');
     return;
   }

   state.isValidating = true;
   setStatus('loading', 'Validando...');
   showLoading(true);

   try {
     var requestBody = { type: state.language, query: query };
     var response = await fetch(API_BASE + '/validate', {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + sessionStorage.getItem('validator_token')
       },
       body: JSON.stringify(requestBody)
     });

     var data = await response.json();

     state.stats.validations++;
     if (data.valid) state.stats.valid++;
     else state.stats.invalid++;
     localStorage.setItem('validator-stats', JSON.stringify(state.stats));
     updateStats();

     addToHistory(query, data);
     showResults(data);
     decorateErrors(data.errors || []);

     if (data.valid) {
       setStatus('success', 'Sintaxis correcta');
       showToast('✅ Sintaxis correcta', 'success');
     } else {
       setStatus('error', data.errors.length + ' error(es)');
     }
   } catch (err) {
     console.error('Error de conexión:', err);
     setStatus('error', 'Error de conexión');
     showResults({
       valid: false,
       errors: [{ line: 0, column: 1, message: 'No se pudo conectar al servidor. ¿Está corriendo el backend?' }],
       suggestions: ['Ejecuta: npm start']
     });
   } finally {
     state.isValidating = false;
     showLoading(false);
   }
 }

function normalizeIncompatible(item) {
  if (typeof item === 'string') {
    return { engine: item, reasons: [] };
  }
  return {
    engine: item.engine || item.name || String(item),
    reasons: item.reasons || []
  };
}

function reasonText(reason) {
  var map = {
    RETURNING: 'La cláusula RETURNING no pertenece al subconjunto SQL ANSI y no está disponible en todos los motores.',
    LIMIT: 'La cláusula LIMIT no es compatible con SQL Server ni Oracle clásico.',
    TOP: 'TOP es una cláusula específica de SQL Server.',
    NOLOCK: 'WITH (NOLOCK) es una pista específica de SQL Server.',
    AUTO_INCREMENT: 'AUTO_INCREMENT es específico de MySQL.',
    AUTOINCREMENT: 'AUTOINCREMENT es específico de SQLite.',
    USE: 'La sentencia USE es válida en MySQL y SQL Server, pero no pertenece a SQL ANSI.',
    ILIKE: 'ILIKE es específico de PostgreSQL.',
    ROWNUM: 'ROWNUM es específico de Oracle.',
    PRAGMA: 'PRAGMA es específico de SQLite.',
    GO: 'GO es un separador de lotes específico de SQL Server.',
    LOCK: 'LOCK TABLES es una sentencia específica de MySQL y MariaDB.',
    UNLOCK: 'UNLOCK TABLES es una sentencia específica de MySQL y MariaDB.',
    DELIMITER: 'DELIMITER es una directiva de scripts MySQL/MariaDB para cambiar el separador de sentencias.',
    'LOCK TABLES': 'LOCK TABLES es una sentencia específica de MySQL y MariaDB.',
    'UNLOCK TABLES': 'UNLOCK TABLES es una sentencia específica de MySQL y MariaDB.',
    'DECLARE @': 'DECLARE con variables @ es específico de SQL Server.',
    'START TRANSACTION': 'START TRANSACTION es propio de MySQL y PostgreSQL.',
    'SET SEARCH_PATH': 'La sentencia SET search_path es específica de PostgreSQL.',
    'SET @': 'SET @variable es sintaxis de variables de SQL Server.',
    'Sintaxis SQL': 'La consulta usa gramática SQL, no sintaxis MongoDB.',
    'Sintaxis MongoDB': 'La consulta utiliza sintaxis de MongoDB basada en db.coleccion.metodo().'
  };
  return map[reason] || ('Uso de: ' + reason);
}

function renderCompatibility(data) {
  var main = data.dialect || (state.language === 'sql' ? 'SQL' : 'MongoDB');
  var compatible = data.compatible && data.compatible.length ? data.compatible : [main];
  var incompatible = (data.incompatible || []).map(normalizeIncompatible);
  var html = '<div class="result-detail">';
  html += '<div class="detail-row"><span>Motor detectado:</span><strong>' + escapeHtml(main) + '</strong></div>';
  if (data.type) {
    html += '<div class="detail-row"><span>Tipo:</span><strong>' + escapeHtml(data.type) + '</strong></div>';
  }
  if (data.collection) {
    html += '<div class="detail-row"><span>Colección:</span><strong>' + escapeHtml(data.collection) + '</strong></div>';
  }
  html += '<div class="compat-block">';
  html += '<h4>Compatibilidad</h4>';
  html += '<div class="compat-main">✓ ' + escapeHtml(main) + '</div>';
  html += '<div class="compat-subtitle">Motores compatibles:</div>';
  html += '<ul class="compat-list">' + compatible.map(function (engine) {
    return '<li>' + escapeHtml(engine) + '</li>';
  }).join('') + '</ul>';
  if (incompatible.length > 0) {
    html += '<div class="compat-subtitle">Motores no compatibles:</div>';
    html += '<ul class="compat-list muted">' + incompatible.map(function (item) {
      return '<li>' + escapeHtml(item.engine) + '</li>';
    }).join('') + '</ul>';

    var reasons = [];
    incompatible.forEach(function (item) {
      (item.reasons || []).forEach(function (reason) {
        var text = reasonText(reason);
        if (reasons.indexOf(text) === -1) reasons.push(text);
      });
    });
    if (reasons.length > 0) {
      html += '<div class="compat-subtitle">Motivo:</div>';
      html += '<div class="compat-reason">' + reasons.map(escapeHtml).join('<br>') + '</div>';
    }
  }
  html += '</div></div>';
  return html;
}

function showResults(data) {
  var empty = document.getElementById('results-empty');
  var validEl = document.getElementById('results-valid');
  var invalidEl = document.getElementById('results-invalid');
  var meta = document.getElementById('results-meta');

  empty.hidden = true;
  validEl.hidden = true;
  invalidEl.hidden = true;

  if (data.valid) {
    validEl.hidden = false;
    document.getElementById('results-title').innerHTML = '<span id="results-icon" aria-hidden="true">✅</span> Resultados — Válido';
    meta.textContent = data.confidence ? 'Confianza: ' + data.confidence + '%' : '';

    var sugList = document.getElementById('suggestions-valid');
    sugList.innerHTML = renderCompatibility(data);
  } else {
    invalidEl.hidden = false;
    document.getElementById('results-title').innerHTML = '<span id="results-icon" aria-hidden="true">🔴</span> Resultados — Errores';
    meta.textContent = (data.errors || []).length + ' error(es)';

    var errList = document.getElementById('errors-list');
    errList.innerHTML = renderCompatibility(data);
    
    // Preparar marcadores para Monaco
    const markers = [];
    
    (data.errors || []).forEach(function (err) {
      // 1. Mostrar en UI
      var div = document.createElement('div');
      div.className = 'error-item-detailed';
      div.style.marginBottom = '15px';
      div.style.padding = '10px';
      div.style.background = 'rgba(244,71,71,0.1)';
      div.style.borderLeft = '3px solid #f44747';
      div.style.borderRadius = '4px';

      let engineStr = data.dialect ? data.dialect : (state.language === 'sql' ? 'SQL' : 'MongoDB');

      let html = `<div style="font-weight:bold;color:#f44747;margin-bottom:8px;">Consulta inválida</div>`;
      html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Motor detectado:</strong><br>${escapeHtml(engineStr)}</div>`;
      html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Línea:</strong> ${err.line || 1}</div>`;
      html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Columna:</strong> ${err.column || 1}</div>`;
      if (err.position) {
        html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Posición:</strong><br>Carácter ${err.position}</div>`;
      }
      
      if (err.operator) {
        html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Operador afectado:</strong><br>${escapeHtml(err.operator)}</div>`;
      }
      
      html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Problema:</strong><br>${escapeHtml(err.message)}</div>`;
      
      if (err.fragment) {
        html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Consulta encontrada:</strong><br><code>${escapeHtml(err.fragment)}</code></div>`;
      }
      
      if (err.suggestion) {
        html += `<div style="font-size:12px;margin-bottom:4px;"><strong>Sugerencia:</strong><br>${escapeHtml(err.suggestion)}</div>`;
      }

      div.innerHTML = html;
      
      div.addEventListener('click', function () {
        if (err.line > 0) {
          state.editor.revealLineInCenter(err.line);
          state.editor.setPosition({ lineNumber: err.line, column: err.column || 1 });
          state.editor.focus();
        }
      });
      div.style.cursor = 'pointer';
      errList.appendChild(div);

      // 2. Añadir marcador para Monaco
      if (err.line > 0) {
        let endCol = err.column + (err.fragment ? err.fragment.length : 1);
        if (!err.fragment) endCol = err.column + 5; // Default width
        
        markers.push({
          startLineNumber: err.line,
          startColumn: err.column || 1,
          endLineNumber: err.line,
          endColumn: endCol,
          message: err.message + (err.suggestion ? '\\n\\nSugerencia: ' + err.suggestion : ''),
          severity: monaco.MarkerSeverity.Error
        });
      }
    });

    // Ocultamos la antigua sección de sugerencias ya que ahora van incrustadas en el error
    document.getElementById('suggestions-section').hidden = true;

    // Aplicar marcadores
    if (state.editor) {
      monaco.editor.setModelMarkers(state.editor.getModel(), 'validator', markers);
    }

    var sugSection = document.getElementById('suggestions-section');
    var sugList2 = document.getElementById('suggestions-list');
    sugList2.innerHTML = '';
    if (data.suggestions && data.suggestions.length > 0) {
      sugSection.hidden = false;
      data.suggestions.forEach(function (s) {
        var div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = '<span class="suggestion-icon">💡</span><span>' + escapeHtml(s) + '</span>';
        sugList2.appendChild(div);
      });
    } else {
      sugSection.hidden = true;
    }
  }
}

// Ya no usamos deltaDecorations, usamos setModelMarkers directamente en showResults
var currentDecorations = [];
function decorateErrors(errors) {
  // Función mantenida por compatibilidad o limpiar decoraciones previas si no hay errores
  if (!state.editor || !errors || errors.length === 0) {
    monaco.editor.setModelMarkers(state.editor.getModel(), 'validator', []);
  }
}

function addToHistory(query, result) {
   state.history.unshift({
     query: query,
     type: state.language,
     dialect: result.dialect || undefined,
     valid: result.valid,
     errorsCount: (result.errors || []).length,
     time: new Date().toISOString()
   });
   if (state.history.length > MAX_HISTORY) state.history.pop();
   localStorage.setItem('validator-history', JSON.stringify(state.history));
   renderHistory();
 }

function renderHistory() {
  var list = document.getElementById('history-list');
  var empty = document.getElementById('history-empty');

  var items = list.querySelectorAll('.history-item');
  items.forEach(function (el) { el.remove(); });

  if (state.history.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  state.history.forEach(function (item) {
    var div = document.createElement('div');
    div.className = 'history-item ' + (item.valid ? 'valid' : 'invalid');
    div.setAttribute('role', 'listitem');

    var time = new Date(item.time);
    var timeStr = time.getHours().toString().padStart(2, '0') + ':' + time.getMinutes().toString().padStart(2, '0');

    div.innerHTML =
      '<div class="history-item-header">' +
        '<span class="history-badge ' + item.type + '">' + item.type.toUpperCase() + '</span>' +
        '<span class="history-status ' + (item.valid ? 'valid' : 'invalid') + '">' +
          (item.valid ? '✅' : '❌') +
        '</span>' +
        '<span class="history-time">' + timeStr + '</span>' +
      '</div>' +
      '<div class="history-preview">' + escapeHtml(item.query.substring(0, 80)) + '</div>';

    div.addEventListener('click', function () {
      state.editor.setValue(item.query);
      if (item.type !== state.language) {
        document.getElementById('language-select').value = item.type;
        switchLanguage(item.type);
      }
      switchToTab('editor');
      showToast('Consulta cargada', 'info');
    });

    list.appendChild(div);
  });
}

async function loadExamples() {
  try {
    var res = await fetch(API_BASE + '/examples', {
      headers: {
        'Authorization': 'Bearer ' + sessionStorage.getItem('validator_token')
      }
    });
    state.examples = await res.json();
  } catch (e) {
    state.examples = {
      sql: [
        { label: 'SELECT básico', query: 'SELECT * FROM usuarios WHERE edad > 18;' },
        { label: 'SQL con error', query: 'SELCT nombre FORM usuarios;' }
      ],
      nosql: [
        { label: 'find() básico', query: '{\n  "find": "usuarios",\n  "filter": { "activo": true }\n}' }
      ]
    };
  }
}

function showExamplesModal() {
  document.getElementById('modal-examples').hidden = false;
  renderExamples(state.language);
}

function renderExamples(type) {
  var list = document.getElementById('examples-list');
  list.innerHTML = '';

  document.querySelectorAll('.example-tab').forEach(function (t) {
    t.classList.toggle('active', t.dataset.type === type);
  });

  var items = state.examples[type] || [];
  items.forEach(function (ex) {
    var div = document.createElement('div');
    div.className = 'example-item';
    div.setAttribute('role', 'listitem');
    div.innerHTML =
      '<div class="example-label">' + escapeHtml(ex.label) + '</div>' +
      '<div class="example-preview">' + escapeHtml(ex.query.substring(0, 80)) + '</div>';
    div.addEventListener('click', function () {
      if (type !== state.language) {
        document.getElementById('language-select').value = type;
        switchLanguage(type);
      }
      state.editor.setValue(ex.query);
      document.getElementById('modal-examples').hidden = true;
      showToast('Ejemplo cargado', 'info');
    });
    list.appendChild(div);
  });
}

function switchLanguage(lang) {
   state.language = lang;

   var select = document.getElementById('language-select');
   if (select) select.value = lang;

   var monacoLang = lang === 'sql' ? 'sql' : 'json';
   if (state.editor) {
     monaco.editor.setModelLanguage(state.editor.getModel(), monacoLang);
   }

   var badge = document.getElementById('badge-label');
   var desc = document.getElementById('badge-desc');
   badge.textContent = lang === 'sql' ? 'SQL' : 'NoSQL';
   badge.className = 'badge ' + (lang === 'sql' ? 'sql-badge' : 'nosql-badge');
   desc.textContent = lang === 'sql' ? 'Structured Query Language' : 'MongoDB Query Language';

   document.getElementById('editor-lang-indicator').textContent = lang === 'sql' ? 'SQL' : 'JSON (MongoDB)';
   document.getElementById('status-language').innerHTML =
     '<span class="status-icon">🗃️</span>' + (lang === 'sql' ? 'SQL' : 'MongoDB');

   var tabLabel = document.querySelector('#tab-editor .tab-label');
   if (tabLabel) tabLabel.textContent = lang === 'sql' ? 'validator.sql' : 'validator.nosql';

   currentDecorations = state.editor ? state.editor.deltaDecorations(currentDecorations, []) : [];
   resetResults();
 }

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.className = state.theme === 'dark' ? 'theme-dark' : 'theme-light';
  document.getElementById('btn-theme-toggle').querySelector('.theme-icon').textContent =
    state.theme === 'dark' ? '🌙' : '☀️';
  monaco.editor.setTheme(state.theme === 'dark' ? 'validator-dark' : 'validator-light');
  localStorage.setItem('validator-theme', state.theme);
}

function setStatus(type, text) {
  var dot = document.querySelector('.status-dot');
  dot.className = 'status-dot ' + type;
  document.querySelector('.status-text').textContent = text;
  document.getElementById('status-message').textContent = text;
}

function showLoading(show) {
  document.getElementById('results-loading').hidden = !show;
  if (show) {
    document.getElementById('results-empty').hidden = true;
    document.getElementById('results-valid').hidden = true;
    document.getElementById('results-invalid').hidden = true;
  }
}

function resetResults() {
  document.getElementById('results-empty').hidden = true;
  document.getElementById('results-valid').hidden = true;
  document.getElementById('results-invalid').hidden = true;
  document.getElementById('results-loading').hidden = true;
  document.getElementById('results-meta').textContent = '';
  document.getElementById('results-title').innerHTML = '<span id="results-icon" aria-hidden="true">🔎</span> Resultados';
  setStatus('idle', 'Listo');
  if (state.editor) {
    monaco.editor.setModelMarkers(state.editor.getModel(), 'validator', []);
  }
}

function updateStats() {
  document.getElementById('stat-validations').textContent = state.stats.validations;
  document.getElementById('stat-valid').textContent = state.stats.valid;
  document.getElementById('stat-invalid').textContent = state.stats.invalid;
}

function switchToTab(tab) {
  // Tabs eliminados. Editor e historial están en layout side-by-side.
  if (state.editor) state.editor.layout();
}

function showToast(message, type) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('toast-fade');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3000);
}

function updateClock() {
  var now = new Date();
  document.getElementById('status-time').textContent =
    now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function () {
  var savedTheme = localStorage.getItem('validator-theme');
  if (savedTheme === 'light') {
    state.theme = 'light';
    document.body.className = 'theme-light';
    document.getElementById('btn-theme-toggle').querySelector('.theme-icon').textContent = '☀️';
  }

  const token = sessionStorage.getItem('validator_token');
  if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = '/login.html';
    return;
  }

  // Authentication and User info
  const username = sessionStorage.getItem('validator_user') || 'Anónimo';
  const usernameEl = document.getElementById('header-username');
  if (usernameEl) usernameEl.textContent = username;



  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await fetch(API_BASE + '/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('validator_token')
          }
        });
      } catch(e) {
        console.error('Error logging out', e);
      }
      sessionStorage.removeItem('validator_token');
      sessionStorage.removeItem('validator_user');
      sessionStorage.removeItem('validator_role');
      window.location.href = '/login.html';
    });
  }

  initMonaco();

  document.getElementById('btn-validate').addEventListener('click', doValidate);

  document.getElementById('btn-clear').addEventListener('click', function () {
    state.editor.setValue('');
    currentDecorations = state.editor.deltaDecorations(currentDecorations, []);
    resetResults();
    showToast('Editor limpiado', 'info');
  });



  document.getElementById('btn-example').addEventListener('click', showExamplesModal);

  document.getElementById('btn-copy').addEventListener('click', function () {
    navigator.clipboard.writeText(state.editor.getValue()).then(function () {
      showToast('Consulta copiada', 'success');
    });
  });

  // Subida de archivos
  const fileInput = document.getElementById('file-input');
  document.getElementById('btn-upload').addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    let type = 'sql';
    if (ext === 'json' || ext === 'nosql') type = 'nosql';
    else if (ext !== 'sql') {
        showToast('Extensión no soportada', 'error');
        fileInput.value = '';
        return;
    }

    if (file.size > 1024 * 1024) { // Mayor a 1MB
        showToast('Archivo grande detectado. Iniciando análisis en streaming...', 'info');
        switchLanguage(type);
        state.editor.setValue('-- El archivo es muy grande para mostrarse en el editor.\\n-- Analizando en segundo plano...');
        
        setStatus('loading', 'Analizando... 0%');
        showLoading(true);
        state.isValidating = true;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        try {
            const response = await fetch(API_BASE + '/validate/file', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + sessionStorage.getItem('validator_token')
                },
                body: formData
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // Mantener el último fragmento incompleto
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6));
                        if (data.type === 'progress') {
                            setStatus('loading', `Analizando... ${data.percent}%`);
                        } else if (data.type === 'result') {
                            showResults(data.data);
                            addToHistory('Validación de archivo grande: ' + file.name, data.data);
                            if (data.data.valid) {
                                setStatus('success', 'Sintaxis correcta');
                                showToast('✅ Sintaxis correcta en archivo', 'success');
                            } else {
                                setStatus('error', data.data.errors.length + ' error(es)');
                            }
                        } else if (data.type === 'error') {
                            setStatus('error', 'Error en análisis');
                            showToast('Error: ' + data.message, 'error');
                        }
                    }
                }
            }
        } catch (err) {
            setStatus('error', 'Error de red');
            showToast('Error al conectar con el servidor', 'error');
        } finally {
            state.isValidating = false;
            showLoading(false);
            fileInput.value = '';
        }
    } else {
        // Archivo pequeño, leer normal
        const reader = new FileReader();
        reader.onload = function (event) {
          const content = event.target.result;
          switchLanguage(type);
          state.editor.setValue(content);
          showToast('Archivo cargado. Presione validar.', 'success');
          fileInput.value = '';
        };
        reader.onerror = function () {
          showToast('Error al leer archivo', 'error');
        };
        reader.readAsText(file);
    }
  });

  document.getElementById('btn-clear-results').addEventListener('click', resetResults);
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);

document.getElementById('language-select').addEventListener('change', function (e) {
     switchLanguage(e.target.value);
     state.editor.setValue(getDefaultQuery(e.target.value));
   });

// Tabs removed
   
   document.getElementById('btn-clear-history').addEventListener('click', function () {
     state.history = [];
     localStorage.setItem('validator-history', '[]');
     renderHistory();
     showToast('Historial limpiado', 'info');
   });


  document.getElementById('modal-close').addEventListener('click', function () {
    document.getElementById('modal-examples').hidden = true;
  });
  document.getElementById('modal-examples').addEventListener('click', function (e) {
    if (e.target === this) this.hidden = true;
  });
  document.querySelectorAll('.example-tab').forEach(function (tab) {
    tab.addEventListener('click', function () { renderExamples(this.dataset.type); });
  });

  document.getElementById('btn-fullscreen').addEventListener('click', function () {
    var el = document.getElementById('monaco-container');
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(function () {});
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const modalEx = document.getElementById('modal-examples');
      if (modalEx && !modalEx.hidden) modalEx.hidden = true;
    }
  });
});
