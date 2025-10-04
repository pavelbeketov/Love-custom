    // Year
    document.getElementById('y').textContent = new Date().getFullYear();

    // Tabs behavior — показываем/скрываем секции
    const tabs = document.querySelectorAll('.tab');
    const panels = ['#examples','#materials','#pricing','#care','#reviews','#contact'].map(s=>document.querySelector(s));

    function activate(target){
      tabs.forEach(t=>t.classList.toggle('active', t.dataset.target===target));
      panels.forEach(p=>{
        if('#'+p.id===target){ p.classList.remove('hidden');
          p.scrollIntoView({behavior:'smooth', block:'start'});
        } else { p.classList.add('hidden'); }
      });
    }

    tabs.forEach(t=>{
      t.addEventListener('click',()=>activate(t.dataset.target));
    });

    // Default open examples
    activate('#examples');

    // Simple form handler (демо)
    const form = document.getElementById('feedbackForm');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const ok = form.reportValidity();
      if(!ok) return;
      document.getElementById('formNote').style.display='block';
      form.reset();
    });
