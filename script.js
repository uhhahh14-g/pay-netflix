/**
 * PSYFLIX - 영화 데이터 로드 & 렌더링 스크립트
 * TMDB API 사용 (now_playing)
 */

// ─── 설정 ───────────────────────────────────────────────
const API_KEY    = 'e346c760dc1c4b8839d9b163e8214bd6';
const BASE_URL   = 'https://api.themoviedb.org/3';
const IMG_W500   = 'https://image.tmdb.org/t/p/w500';
const IMG_ORIG   = 'https://image.tmdb.org/t/p/original';
const IMG_W780   = 'https://image.tmdb.org/t/p/w780';
const LANG       = 'ko-KR';

// ─── DOM 요소 ────────────────────────────────────────────
const siteHeader    = document.getElementById('siteHeader');
const heroSkeleton  = document.getElementById('heroSkeleton');
const heroContent   = document.getElementById('heroContent');
const heroBackdrop  = document.getElementById('heroBackdrop');
const heroTitle     = document.getElementById('heroTitle');
const heroOverview  = document.getElementById('heroOverview');
const heroMeta      = document.getElementById('heroMeta');
const heroPlayBtn   = document.getElementById('heroPlayBtn');
const heroInfoBtn   = document.getElementById('heroInfoBtn');

const skeletonRow   = document.getElementById('skeletonRow');
const moviesRow     = document.getElementById('moviesRow');

const top10Section  = document.getElementById('top10Section');
const top10Grid     = document.getElementById('top10Grid');

const errorWrap     = document.getElementById('errorWrap');
const errorMsg      = document.getElementById('errorMsg');
const retryBtn      = document.getElementById('retryBtn');

const modalOverlay  = document.getElementById('modalOverlay');
const modalClose    = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalInfo     = document.getElementById('modalInfo');

const btnScrollLeft  = document.getElementById('btnScrollLeft');
const btnScrollRight = document.getElementById('btnScrollRight');

// ─── 상태 ────────────────────────────────────────────────
let allMovies = [];
let featuredMovie = null;

// ─── 헤더 스크롤 처리 ────────────────────────────────────
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}, { passive: true });

// ─── TMDB API 호출 ───────────────────────────────────────
async function fetchNowPlaying(page = 1) {
  const url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=${LANG}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return await res.json();
}

// ─── 별점 표시 헬퍼 ──────────────────────────────────────
function starRating(vote) {
  const stars = Math.round(vote / 2);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

function formatVote(vote) {
  return vote.toFixed(1);
}

// ─── 히어로 배너 렌더링 ──────────────────────────────────
function renderHero(movie) {
  featuredMovie = movie;

  // 배경 이미지
  const bdPath = movie.backdrop_path || movie.poster_path;
  heroBackdrop.style.backgroundImage = `url(${IMG_ORIG}${bdPath})`;

  // 제목
  heroTitle.textContent = movie.title || movie.original_title;

  // 줄거리
  heroOverview.textContent = movie.overview
    ? movie.overview
    : '줄거리 정보가 없습니다.';

  // 메타 정보
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const vote = movie.vote_average ? formatVote(movie.vote_average) : 'N/A';
  heroMeta.innerHTML = `
    <span class="rating">⭐ ${vote}</span>
    <span class="divider"></span>
    <span class="year">${year}</span>
    <span class="divider"></span>
    <span class="votes">평가 ${movie.vote_count?.toLocaleString() || 0}개</span>
  `;

  // 상세 정보 버튼 → 모달 오픈
  heroInfoBtn.onclick = () => openModal(movie);
  heroPlayBtn.onclick = () => openModal(movie);

  // 히어로 표시
  heroSkeleton.style.display = 'none';
  heroContent.style.display = 'block';
}

// ─── 영화 카드 렌더링 ────────────────────────────────────
function renderMovieCards(movies) {
  moviesRow.innerHTML = '';

  movies.forEach(movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-id', movie.id);

    const posterSrc = movie.poster_path
      ? `${IMG_W500}${movie.poster_path}`
      : 'https://via.placeholder.com/180x270/1f1f1f/666?text=No+Image';

    const title = movie.title || movie.original_title;
    const vote = movie.vote_average ? formatVote(movie.vote_average) : 'N/A';

    card.innerHTML = `
      <img class="movie-poster" src="${posterSrc}" alt="${title}" loading="lazy">
      <div class="card-play-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </div>
      <div class="movie-card-overlay">
        <div class="card-title">${title}</div>
        <div class="card-rating">⭐ ${vote}</div>
      </div>
      <div class="card-bottom-info">
        <div class="card-bottom-title">${title}</div>
      </div>
    `;

    card.addEventListener('click', () => openModal(movie));
    moviesRow.appendChild(card);
  });

  // 스켈레톤 숨기고 실제 카드 표시
  skeletonRow.classList.add('hidden');
  moviesRow.classList.remove('hidden');
}

// ─── TOP 10 렌더링 ───────────────────────────────────────
function renderTop10(movies) {
  const top10 = [...movies]
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 10);

  top10Grid.innerHTML = '';

  top10.forEach((movie, idx) => {
    const rank = idx + 1;
    const card = document.createElement('div');
    card.className = 'top10-card';

    const posterSrc = movie.poster_path
      ? `${IMG_W500}${movie.poster_path}`
      : 'https://via.placeholder.com/60x85/1f1f1f/666?text=';

    const title = movie.title || movie.original_title;
    const vote = movie.vote_average ? formatVote(movie.vote_average) : 'N/A';
    const year = movie.release_date ? movie.release_date.slice(0, 4) : '';

    card.innerHTML = `
      <div class="top10-rank ${rank <= 3 ? 'top3' : ''}">${rank}</div>
      <div class="top10-poster-wrap">
        <img class="top10-poster" src="${posterSrc}" alt="${title}" loading="lazy">
      </div>
      <div class="top10-info">
        <div class="top10-title">${title}</div>
        <div class="top10-rating">⭐ ${vote}</div>
        <div class="top10-votes">${year} · 평가 ${movie.vote_count?.toLocaleString() || 0}개</div>
      </div>
    `;

    card.addEventListener('click', () => openModal(movie));
    top10Grid.appendChild(card);
  });

  top10Section.style.display = 'block';
}

// ─── 모달 오픈 ───────────────────────────────────────────
function openModal(movie) {
  const bdPath = movie.backdrop_path
    ? `${IMG_W780}${movie.backdrop_path}`
    : (movie.poster_path ? `${IMG_W500}${movie.poster_path}` : '');

  modalBackdrop.style.backgroundImage = bdPath ? `url(${bdPath})` : 'none';
  modalBackdrop.style.backgroundColor = bdPath ? '' : '#1e1e1e';

  const title = movie.title || movie.original_title;
  const vote = movie.vote_average ? formatVote(movie.vote_average) : 'N/A';
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const lang = movie.original_language?.toUpperCase() || '';
  const overview = movie.overview || '줄거리 정보가 없습니다.';
  const popularity = movie.popularity ? Math.round(movie.popularity) : 0;

  modalInfo.innerHTML = `
    <h2 class="modal-title">${title}</h2>
    <div class="modal-meta-row">
      <span class="modal-rating">⭐ ${vote} / 10</span>
      <span class="modal-year">${year}</span>
      ${lang ? `<span class="modal-lang">🌐 ${lang}</span>` : ''}
      <span class="modal-popularity">🔥 인기도 ${popularity.toLocaleString()}</span>
    </div>
    <p class="modal-overview">${overview}</p>
    <button class="modal-play-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      재생하기
    </button>
  `;

  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ─── 모달 닫기 ───────────────────────────────────────────
function closeModal() {
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── 가로 스크롤 버튼 ────────────────────────────────────
btnScrollLeft.addEventListener('click', () => {
  moviesRow.scrollBy({ left: -600, behavior: 'smooth' });
});
btnScrollRight.addEventListener('click', () => {
  moviesRow.scrollBy({ left: 600, behavior: 'smooth' });
});

// ─── 에러 표시 ───────────────────────────────────────────
function showError(msg) {
  heroSkeleton.style.display = 'none';
  skeletonRow.classList.add('hidden');
  errorMsg.textContent = msg;
  errorWrap.classList.remove('hidden');
}

// ─── 메인 초기화 ────────────────────────────────────────
async function init() {
  errorWrap.classList.add('hidden');

  try {
    // 두 페이지 동시 로드해서 더 많은 영화 표시
    const [page1, page2] = await Promise.all([
      fetchNowPlaying(1),
      fetchNowPlaying(2)
    ]);

    const movies1 = page1.results || [];
    const movies2 = page2.results || [];
    allMovies = [...movies1, ...movies2].filter(m => m.poster_path);

    if (allMovies.length === 0) {
      showError('현재 상영 중인 영화 데이터가 없습니다.');
      return;
    }

    // 히어로: 인기도 높은 영화 중 랜덤 선택 (backdrop 있는 것)
    const heroPool = allMovies
      .filter(m => m.backdrop_path)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);

    const hero = heroPool[Math.floor(Math.random() * heroPool.length)] || allMovies[0];
    renderHero(hero);

    // 영화 카드 전체 렌더
    renderMovieCards(allMovies);

    // TOP 10 렌더
    renderTop10(allMovies);

  } catch (err) {
    console.error('TMDB API 오류:', err);
    showError(`데이터를 불러오지 못했습니다. (${err.message})`);
  }
}

// 재시도 버튼
retryBtn.addEventListener('click', init);

// 시작
init();
