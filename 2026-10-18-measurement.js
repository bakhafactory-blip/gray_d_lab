(() => {
  'use strict';
  if (window.graydMeasurementReady) return;
  window.graydMeasurementReady = true;
  const id = 'G-PHZ4SB1P98';
  const key = 'grayd-analytics-consent-v1';
  const services = ['ai-fashion-show','ai-fashion-lookbook','fashion-brand-film','retail-ooh-video','projects','studio','inquiry'];
  const requested = new URLSearchParams(location.search).get('service');
  const service = services.includes(requested) ? requested : '';
  const events = ['content_view','inquiry_click','email_click','phone_click','inquiry_success'];
  const safeLocation = 'https://graydlab.ai.kr' + location.pathname;
  let referrer = '';
  try { referrer = new URL(document.referrer).origin + '/'; } catch (_) {}
  let consent = '';
  try { consent = localStorage.getItem(key) || ''; } catch (_) {}
  let started = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const params = () => ({page_location:safeLocation,page_referrer:referrer,page_path:location.pathname,service});
  function start() {
    if (started || consent !== 'granted') return;
    started = true;
    window['ga-disable-' + id] = false;
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',id,{...params(),send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
    window.gtag('event','page_view',params());
    window.gtag('event','content_view',params());
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(script);
  }
  window.graydTrack = event => {
    if (!events.includes(event)) return;
    const data = {event,page_path:location.pathname,service};
    window.dataLayer.push(data);
    document.dispatchEvent(new CustomEvent('grayd:measurement',{detail:data}));
    if (started && consent === 'granted') window.gtag('event',event,params());
  };
  window.graydTrack('content_view');
  document.addEventListener('click',e => {
    const a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (events.includes(a.dataset.event)) window.graydTrack(a.dataset.event);
    else if (a.href.startsWith('mailto:')) window.graydTrack('email_click');
    else if (a.href.startsWith('tel:')) window.graydTrack('phone_click');
  });
  const form = document.getElementById('contactForm');
  if (form && service) {
    const field = document.createElement('input');
    field.type = 'hidden'; field.name = 'service_page'; field.value = service; form.append(field);
    const type = document.getElementById('type'); if (type) type.value = 'video';
  }
  const style = document.createElement('style');
  style.textContent = '#grayd-consent{position:fixed;inset:auto 16px 16px;z-index:10000;max-width:620px;margin:0 auto;padding:20px;background:#fff;color:#262a30;border:1px solid #d8dce1;border-radius:12px;box-shadow:0 6px 30px #0002;font:14px/1.6 sans-serif;text-align:left}#grayd-consent[hidden]{display:none}#grayd-consent p{margin:0 0 12px}#grayd-consent .ga-actions{display:flex;gap:10px;flex-wrap:wrap}#grayd-consent button{padding:9px 16px;border:1px solid #555;border-radius:5px;background:white;color:#262a30;cursor:pointer;font:inherit}#grayd-consent button[data-choice="granted"]{background:#262a30;color:white}#grayd-analytics-settings{display:block;margin:18px auto;padding:8px 12px;border:0;background:transparent;color:inherit;text-decoration:underline;font:13px sans-serif;cursor:pointer}#grayd-consent a{color:#285eb7;text-decoration:underline}';
  document.head.append(style);
  const panel = document.createElement('section');
  panel.id = 'grayd-consent'; panel.setAttribute('aria-label','방문 통계 수집 설정');
  panel.innerHTML = '<p><strong>방문 통계 수집 안내</strong><br>사이트 개선을 위해 동의하신 경우 Google Analytics 쿠키로 방문 경로와 페이지 이용, 문의 버튼 클릭 및 전송 성공 여부를 측정합니다. 문의 양식에 입력한 이름·이메일·내용은 분석 데이터로 보내지 않습니다. 선택은 하단의 “방문 통계 설정”에서 변경할 수 있습니다. <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noopener noreferrer">Google의 데이터 처리 안내</a></p><div class="ga-actions"><button type="button" data-choice="denied">동의하지 않음</button><button type="button" data-choice="granted">통계 수집 동의</button></div>';
  panel.hidden = consent === 'granted' || consent === 'denied';
  document.body.append(panel);
  const settings = document.createElement('button');
  settings.type = 'button'; settings.id = 'grayd-analytics-settings'; settings.textContent = '방문 통계 설정';
  (document.querySelector('footer') || document.body).append(settings);
  settings.addEventListener('click',() => { panel.hidden = false; panel.querySelector('button').focus(); });
  function clearCookies() {
    for (const pair of document.cookie.split(';')) {
      const name = pair.trim().split('=')[0];
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['',location.hostname,'.'+location.hostname]) {
        document.cookie = name+'=; Max-Age=0; Path=/'+(domain?'; Domain='+domain:'')+'; SameSite=Lax';
      }
    }
  }
  panel.addEventListener('click',e => {
    const choice = e.target.dataset.choice;
    if (!['granted','denied'].includes(choice)) return;
    consent = choice;
    try { localStorage.setItem(key,choice); } catch (_) {}
    if (choice === 'denied') {
      window['ga-disable-' + id] = true;
      if (started) window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      clearCookies();
    } else if (started) {
      window['ga-disable-' + id] = false;
      window.gtag('consent','update',{analytics_storage:'granted'});
    } else start();
    panel.hidden = true;
    settings.focus({preventScroll:true});
  });
  if (consent === 'granted') start();
})();
