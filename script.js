// Year
document.getElementById('y').textContent = new Date().getFullYear();

// Tabs behavior — показываем/скрываем секции
const tabs = document.querySelectorAll('.tab');
const panels = ['#examples','#materials','#pricing','#care','#reviews','#contact','#about'].map(s=>document.querySelector(s));

function activate(target){
  if(!target) return;
  // ensure target starts with #
  if(!target.startsWith('#')) target = '#'+target;
  tabs.forEach(t=>t.classList.toggle('active', t.dataset.target===target));
  panels.forEach(p=>{
    if(!p) return;
    if('#'+p.id === target){
      p.classList.remove('hidden');
      // небольшая задержка для плавного скрола после открытия
      setTimeout(()=> p.scrollIntoView({behavior:'smooth', block:'start'}), 40);
    } else {
      p.classList.add('hidden');
    }
  });
}

// Click on nav tabs
tabs.forEach(t=>{
  t.addEventListener('click', ()=> {
    const target = t.dataset.target;
    history.pushState(null, '', target);
    activate(target);
  });
});

// Anchor links (hero button and any other internal anchors)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(!href || href === '#') return;
    e.preventDefault();
    history.pushState(null, '', href);
    activate(href);
  });
});

// React to back/forward and manual hash changes
window.addEventListener('hashchange', ()=> activate(location.hash || '#examples'));

// On load, open section from hash or default to examples
// window.addEventListener('load', ()=> {
//   activate(location.hash || '#examples');
// });

// Simple form handler (демо) — guarded in case form is commented out
const form = document.getElementById('feedbackForm');
if(form){
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const ok = form.reportValidity();
    if(!ok) return;
    const note = document.getElementById('formNote');
    if(note) note.style.display='block';
    form.reset();
  });
}

// === Lightbox по альбомам + поддержка data-images (JSON) ===
(() => {
  const grid = document.querySelector('#examples .gallery');
  if (!grid) return;

  const lb = document.getElementById('lightbox');
  const slideEl = document.getElementById('lbSlide');
  const infoEl  = document.getElementById('lbInfo');
  const thumbsEl= document.getElementById('lbThumbs');
  const prevBtn = document.getElementById('lbPrev');
  const nextBtn = document.getElementById('lbNext');
  const closeBtn= document.getElementById('lbClose');

  const items = [...grid.querySelectorAll('.ph')];

  // Собираем { albumName: [{src, caption, thumb}] } из каждой карточки
  const albums = {};
  items.forEach((it) => {
    const album   = it.dataset.album || 'default';
    const cover   = it.dataset.full || it.querySelector('img')?.src;
    const caption = it.dataset.caption || it.querySelector('img')?.alt || '';
    const thumb   = it.querySelector('img')?.src || cover;

    // читаем массив картинок из data-images (JSON)
    let list = [];
    if (it.dataset.images) {
      try { list = JSON.parse(it.dataset.images); } catch (_) { list = []; }
    }
    // гарантируем, что обложка тоже в списке
    if (!list.length) list = [cover];
    else if (!list.includes(cover)) list.unshift(cover);

    const prepared = list.map((src, i) => ({
      src,
      caption: i === 0 ? caption : '', // подпись только у обложки (можно расширить)
      thumb: i === 0 ? thumb : src
    }));

    albums[album] = prepared; // одна карточка = один альбом (с множеством картинок)
  });

  let currentAlbum = null;
  let currentIndex = 0;

  function openLightbox(album, index = 0) {
    currentAlbum = album;
    currentIndex = index;
    renderThumbs();
    showSlide(currentIndex, true);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function showSlide(i, animate=false) {
    const arr = albums[currentAlbum] || [];
    if (!arr.length) return;
    currentIndex = (i + arr.length) % arr.length;
    const { src, caption } = arr[currentIndex];

    slideEl.src = src;
    slideEl.alt = caption || 'Фото';
    infoEl.textContent = `${currentAlbum} — ${currentIndex+1}/${arr.length}${caption ? ' · '+caption : ''}`;

    [...thumbsEl.querySelectorAll('img')].forEach((t, idx) => {
      t.classList.toggle('active', idx === currentIndex);
    });

    if (animate) {
      slideEl.classList.remove('fade'); void slideEl.offsetWidth; slideEl.classList.add('fade');
    }
  }

  function renderThumbs() {
    const arr = albums[currentAlbum] || [];
    thumbsEl.innerHTML = '';
    arr.forEach((item, idx) => {
      const im = document.createElement('img');
      im.src = item.thumb || item.src;
      im.alt = item.caption || `Миниатюра ${idx+1}`;
      im.addEventListener('click', () => showSlide(idx, true));
      thumbsEl.appendChild(im);
    });
  }

  // Открытие альбома по клику на карточку (берём её data-images)
  items.forEach((it) => {
    it.addEventListener('click', () => {
      const album = it.dataset.album || 'default';
      openLightbox(album, 0);
    });
    it.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); }
    });
  });

  prevBtn.addEventListener('click', () => showSlide(currentIndex - 1, true));
  nextBtn.addEventListener('click', () => showSlide(currentIndex + 1, true));
  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showSlide(currentIndex - 1, true);
    if (e.key === 'ArrowRight') showSlide(currentIndex + 1, true);
  });

  // Свайпы (тач)
  let touchX = 0, touchY = 0, moved = false;
  slideEl.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; touchX = t.clientX; touchY = t.clientY; moved = false;
  }, { passive: true });
  slideEl.addEventListener('touchmove', () => { moved = true; }, { passive: true });
  slideEl.addEventListener('touchend', (e) => {
    if (!moved) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) showSlide(currentIndex + 1, true); else showSlide(currentIndex - 1, true);
    }
  }, { passive: true });
})();

// About: open inline section when clicking brand
(function(){
  const brand = document.querySelector('.brand');
  if(!brand) return;
  brand.addEventListener('click', (e) => {
    e.preventDefault(); // prevent jump to #top
    const target = '#about';
    history.pushState(null, '', target);
    activate(target);
  });
})();
