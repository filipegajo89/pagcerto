// Configurações globais
let currentMode = 'installment';
let cdiMensal = NaN;

// Gerenciador de Modo de Cálculo
const modeManager = {
  init() {
    const modeOptions = document.querySelectorAll('.mode-option');
    const slider = document.getElementById('modeSlider');
    
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const mode = option.dataset.mode;
        this.switchMode(mode);
      });
    });
  },
  
  switchMode(mode) {
    currentMode = mode;
    const slider = document.getElementById('modeSlider');
    const installmentBtn = document.getElementById('modeByInstallment');
    const totalBtn = document.getElementById('modeByTotal');
    const installmentFields = document.getElementById('installmentFields');
    const totalFields = document.getElementById('totalFields');
    
    // Atualizar botões
    if (mode === 'installment') {
      installmentBtn.classList.add('active');
      totalBtn.classList.remove('active');
      slider.classList.remove('right');
      installmentFields.classList.remove('hidden');
      totalFields.classList.add('hidden');
    } else {
      totalBtn.classList.add('active');
      installmentBtn.classList.remove('active');
      slider.classList.add('right');
      totalFields.classList.remove('hidden');
      installmentFields.classList.add('hidden');
    }
    
    // Limpar campos do modo anterior
    this.clearModeFields(mode === 'installment' ? 'total' : 'installment');
  },
  
  clearModeFields(mode) {
    if (mode === 'installment') {
      document.getElementById('p').value = '';
    } else {
      document.getElementById('totalValue').value = '';
    }
  }
};

// Inicializar Cleave.js para formatação
const initCleave = () => {
  // Campos monetários
  new Cleave('#v0', { 
    numeral: true, 
    numeralDecimalMark: ',', 
    delimiter: '.', 
    numeralDecimalScale: 2, 
    numeralThousandsGroupStyle: 'thousand' 
  });
  
  new Cleave('#p', { 
    numeral: true, 
    numeralDecimalMark: ',', 
    delimiter: '.', 
    numeralDecimalScale: 2, 
    numeralThousandsGroupStyle: 'thousand' 
  });
  
  new Cleave('#totalValue', { 
    numeral: true, 
    numeralDecimalMark: ',', 
    delimiter: '.', 
    numeralDecimalScale: 2, 
    numeralThousandsGroupStyle: 'thousand' 
  });
  
  // Campos de percentual
  new Cleave('#cdipercent', { 
    numeral: true, 
    numeralDecimalScale: 0, 
    numeralThousandsGroupStyle: 'none' 
  });
  
  new Cleave('#cdipercent2', { 
    numeral: true, 
    numeralDecimalScale: 0, 
    numeralThousandsGroupStyle: 'none' 
  });
  
  new Cleave('#n_custom', { 
    numeral: true, 
    numeralDecimalScale: 0, 
    numeralThousandsGroupStyle: 'none' 
  });
};

// Sincronizar campos de CDI
document.getElementById('cdipercent').addEventListener('input', function() {
  document.getElementById('cdipercent2').value = this.value;
});

document.getElementById('cdipercent2').addEventListener('input', function() {
  document.getElementById('cdipercent').value = this.value;
});

// Toggle campo "Outra quantidade"
const nSelect = document.getElementById('n_select');
const labelNCustom = document.getElementById('label_n_custom');

function toggleNCustom() {
  if (nSelect.value === 'other') {
    labelNCustom.classList.remove('hidden');
    labelNCustom.style.animation = 'fieldEntry 0.4s ease-out';
  } else {
    labelNCustom.classList.add('hidden');
  }
}

nSelect.addEventListener('change', toggleNCustom);

// Buscar CDI atual
async function fetchCDI() {
  const el = document.getElementById('cdi_valor');
  el.innerHTML = '<span class="loading"></span>';
  
  try {
    const resp = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json');
    if (!resp.ok) throw new Error(resp.status);
    
    const data = await resp.json();
    const diario = parseFloat(data[0].valor.replace(',', '.')) / 100;
    cdiMensal = Math.pow(1 + diario, 21) - 1;
    
    el.textContent = (cdiMensal * 100).toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }) + '% ao mês';
    
  } catch (err) {
    el.textContent = 'indisponível';
    console.error('Erro ao buscar CDI:', err);
  }
}

// Botão de limpar
document.getElementById('btnReset').addEventListener('click', () => {
  // Limpar todos os campos
  document.getElementById('v0').value = '';
  document.getElementById('p').value = '';
  document.getElementById('totalValue').value = '';
  document.getElementById('cdipercent').value = '';
  document.getElementById('cdipercent2').value = '';
  document.getElementById('n_select').value = '';
  document.getElementById('n_custom').value = '';
  
  // Esconder resultados
  ['resCard', 'lineCard', 'barCard', 'donutCard', 'adMiddle', 'adBottom'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  
  // Resetar para modo padrão
  modeManager.switchMode('installment');
  
  // Foco no primeiro campo
  document.getElementById('v0').focus();
});

// Função para formatar valores monetários
function formatMoney(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Função para mostrar os anúncios
function showAds() {
  document.getElementById('adMiddle').classList.remove('hidden');
  document.getElementById('adBottom').classList.remove('hidden');
  
  // Aqui você incluiria o código do AdSense quando implementar
  // Por exemplo:
  // (adsbygoogle = window.adsbygoogle || []).push({});
}

// Função principal de cálculo
document.getElementById('btnCalc').addEventListener('click', () => {
  const btnCalc = document.getElementById('btnCalc');
  const originalText = btnCalc.innerHTML;
  btnCalc.innerHTML = '<span class="loading"></span>Calculando...';
  btnCalc.disabled = true;
  
  setTimeout(() => {
    try {
      // Obter valores dos campos
      const rawV0 = document.getElementById('v0').value.replace(/\./g,'').replace(',', '.').trim();
      const V0 = parseFloat(rawV0);
      
      let n = nSelect.value === 'other'
        ? parseInt(document.getElementById('n_custom').value, 10)
        : parseInt(nSelect.value, 10);
      
      const pct = parseFloat(document.getElementById('cdipercent').value || 
                           document.getElementById('cdipercent2').value || '100');
      const r = cdiMensal * (pct / 100);
      
      let P, F; // P = valor da parcela, F = valor total parcelado
      
      // Determinar P e F baseado no modo
      if (currentMode === 'installment') {
        const rawP = document.getElementById('p').value.replace(/\./g,'').replace(',', '.').trim();
        P = parseFloat(rawP);
        F = P * n;
      } else {
        const rawTotal = document.getElementById('totalValue').value.replace(/\./g,'').replace(',', '.').trim();
        F = parseFloat(rawTotal);
        P = F / n;
      }
      
      const resEl = document.getElementById('res');
      
      // Validação
      if (isNaN(V0) || V0 <= 0) {
        throw new Error('Por favor, informe um preço à vista válido.');
      }
      
      if (!n || n <= 0) {
        throw new Error('Por favor, selecione a quantidade de parcelas.');
      }
      
      if (currentMode === 'installment' && (isNaN(P) || P <= 0)) {
        throw new Error('Por favor, informe um valor de parcela válido.');
      }
      
      if (currentMode === 'total' && (isNaN(F) || F <= 0)) {
        throw new Error('Por favor, informe um valor total parcelado válido.');
      }
      
      if (isNaN(r) || r < 0) {
        throw new Error('Por favor, verifique o percentual de rendimento.');
      }
      
      // Cálculos principais
      let juros = 0, pago = 0;
      for (let i = 0; i < n; i++) {
        pago += P;
        juros += Math.max(F - pago, 0) * r;
      }
      const CL = F - juros;
      
      // Diferença e percentual
      const difValue = Math.abs(CL - V0);
      const difPercent = (difValue / V0) * 100;
      
      // Construir HTML dos resultados
      let resultHTML = '';
      
      // Se modo total, mostrar valor da parcela calculado
      if (currentMode === 'total') {
        resultHTML += `
        <div class="result-row">
          <div class="result-label"><i class="material-icons-round">receipt</i>Valor de cada parcela</div>
          <div class="result-value">${formatMoney(P)}</div>
        </div>`;
      }
      
      // Total parcelado
      resultHTML += `
      <div class="result-row">
        <div class="result-label"><i class="material-icons-round">credit_card</i>Total parcelado</div>
        <div class="result-value">${formatMoney(F)}</div>
      </div>`;
      
      // Rendimento
      resultHTML += `
      <div class="result-row">
        <div class="result-label"><i class="material-icons-round">savings</i>Rendimento potencial</div>
        <div class="result-value">${formatMoney(juros)}</div>
      </div>`;
      
      // Custo líquido
      resultHTML += `
      <div class="result-row">
        <div class="result-label"><i class="material-icons-round">account_balance_wallet</i>Custo líquido</div>
        <div class="result-value">${formatMoney(CL)}</div>
      </div>`;
      
      // Diferença
      resultHTML += `
      <div class="result-row">
        <div class="result-label"><i class="material-icons-round">compare_arrows</i>Diferença</div>
        <div class="result-value">${formatMoney(difValue)} (${difPercent.toFixed(1)}%)</div>
      </div>`;
      
      // Recomendação
      const isBetterParcelado = CL < V0;
      const savings = isBetterParcelado ? V0 - CL : CL - V0;
      
      resultHTML += `
      <div class="recommendation" style="background:linear-gradient(135deg, ${isBetterParcelado ? '#10b981, #059669' : '#3b82f6, #1e40af'})">
        <i class="material-icons-round">${isBetterParcelado ? 'credit_card' : 'payments'}</i>
        <div class="recommendation-text">
          <h3>${isBetterParcelado ? 'Melhor Parcelar' : 'Melhor Pagar à Vista'}</h3>
          <p>Você ${isBetterParcelado ? 'economiza' : 'economizaria'} ${formatMoney(savings)} escolhendo ${isBetterParcelado ? 'parcelar e investir o dinheiro' : 'pagar à vista'}.</p>
        </div>
      </div>`;
      
      resEl.innerHTML = resultHTML;
      
      // Gerar gráficos
      generateCharts(n, P, F, r, V0, CL, juros);
      
      // Mostrar resultados e anúncios
      showResults(true);
      showAds();
      
      // Scroll suave para resultados
      document.getElementById('resCard').scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
    } catch (error) {
      document.getElementById('res').innerHTML = `
        <div class="error">
          <i class="material-icons-round">error_outline</i>
          ${error.message}
        </div>`;
      showResults(false);
    } finally {
      btnCalc.innerHTML = originalText;
      btnCalc.disabled = false;
    }
  }, 600);
});

// Função para gerar gráficos
function generateCharts(n, P, F, r, V0, CL, juros) {
  // Dados para o gráfico de linha
  const saldos = [];
  const meses = [];
  let acumulado = 0;
  
  for (let i = 1; i <= n; i++) {
    acumulado += Math.max(F - (P * i), 0) * r;
    saldos.push(parseFloat(acumulado.toFixed(2)));
    meses.push(`Mês ${i}`);
  }
  
  // Configurações comuns
  const fontFamily = "'Inter', -apple-system, sans-serif";
  const colors = ['#15212d', '#3b7bea', '#10b981', '#ffb400'];
  
  const commonOptions = {
    chart: {
      fontFamily: fontFamily,
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        }
      }
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    tooltip: {
      theme: 'light',
      style: { fontFamily: fontFamily },
      y: { formatter: formatMoney }
    },
    legend: {
      fontFamily: fontFamily,
      fontSize: '14px',
      itemMargin: {
        horizontal: 12,
        vertical: 8
      }
    }
  };
  
  // Gráfico de linha - Crescimento do Saldo
  ApexCharts.exec('line-chart', 'destroy');
  new ApexCharts(document.querySelector('#chart-line'), {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      id: 'line-chart',
      type: 'area',
      height: 380
    },
    series: [{
      name: 'Rendimento Acumulado',
      data: saldos
    }],
    xaxis: {
      categories: meses,
      labels: {
        style: {
          fontFamily: fontFamily,
          colors: '#64748b'
        },
        rotateAlways: false
      }
    },
    yaxis: {
      labels: {
        formatter: formatMoney,
        style: {
          fontFamily: fontFamily,
          colors: '#64748b'
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100]
      }
    },
    colors: [colors[1]]
  }).render();
  
  // Gráfico de barras - Comparativo
  ApexCharts.exec('bar-chart', 'destroy');
  new ApexCharts(document.querySelector('#chart-bar'), {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      id: 'bar-chart',
      type: 'bar',
      height: 380
    },
    series: [
      { name: 'À vista', data: [V0] },
      { name: 'Custo líquido parcelado', data: [CL] }
    ],
    xaxis: {
      categories: ['Comparativo de Custos'],
      labels: {
        style: {
          fontFamily: fontFamily,
          colors: '#64748b'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: formatMoney,
        style: {
          fontFamily: fontFamily,
          colors: '#64748b'
        }
      }
    },
    plotOptions: {
      bar: {
        columnWidth: '60%',
        borderRadius: 8,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: formatMoney,
      offsetY: -30,
      style: {
        fontSize: '14px',
        fontFamily: fontFamily,
        fontWeight: 600,
        colors: ['#15212d']
      }
    },
    colors: [colors[0], colors[3]]
  }).render();
  
  // Gráfico donut - Composição
  ApexCharts.exec('donut-chart', 'destroy');
  new ApexCharts(document.querySelector('#chart-donut'), {
    ...commonOptions,
    chart: {
      ...commonOptions.chart,
      id: 'donut-chart',
      type: 'donut',
      height: 380
    },
    series: [CL, juros],
    labels: ['Custo Real', 'Economia Potencial'],
    colors: [colors[0], colors[3]],
    legend: {
      ...commonOptions.legend,
      position: 'bottom'
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '14px',
        fontFamily: fontFamily,
        fontWeight: 600,
        colors: ['#fff']
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontFamily: fontFamily,
              fontWeight: 500,
              color: '#64748b'
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              color: '#15212d',
              formatter: formatMoney
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Parcelado',
              fontSize: '16px',
              fontFamily: fontFamily,
              fontWeight: 500,
              color: '#64748b',
              formatter: function(w) {
                return formatMoney(F);
              }
            }
          }
        }
      }
    }
  }).render();
}

// Controla exibição dos resultados
function showResults(show) {
  ['resCard', 'lineCard', 'barCard', 'donutCard'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', !show);
  });
}

// Gerenciar footer
document.addEventListener('DOMContentLoaded', function() {
  // Atualizar ano
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // Links do footer
  const footerLinks = document.querySelectorAll('.footer-links a');
  const footerSections = document.querySelectorAll('.footer-section');
  
  footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const sectionId = this.getAttribute('data-section');
      
      // Toggle active
      footerLinks.forEach(lnk => lnk.classList.remove('active'));
      this.classList.add('active');
      
      // Toggle sections
      footerSections.forEach(section => {
        section.classList.remove('active');
      });
      
      const activeSection = document.getElementById(sectionId);
      if (activeSection) {
        activeSection.classList.add('active');
        activeSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Inicialização
window.addEventListener('load', () => {
  modeManager.init();
  initCleave();
  fetchCDI();
  toggleNCustom();
  document.getElementById('v0').focus();
});
