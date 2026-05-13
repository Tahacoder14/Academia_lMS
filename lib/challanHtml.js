import { escapeHtml } from '@/lib/reporting';

function safeAttrUrl(url) {
  if (!url) return '';
  return String(url).replace(/"/g, '%22');
}

export function buildFeeChallanHtml({ institution, student, amount, periodLabel, challanNo }) {
  const school = institution?.name || 'School';
  const logo = institution?.logo_url || '';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Fee challan ${escapeHtml(challanNo)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; color: #0f172a; background: #f8fafc; }
    .card { width: min(100%, 720px); margin: 0 auto; background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 20px 60px rgba(15,23,42,0.08); }
    .head { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { width: 72px; height: 72px; object-fit: contain; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; flex-shrink: 0; }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0.04em; text-transform: uppercase; }
    .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; font-size: 14px; margin-bottom: 24px; }
    .box { background: #f1f5f9; border-radius: 12px; padding: 16px; }
    .amt { font-size: clamp(24px, 3vw, 32px); font-weight: 700; color: #312e81; margin-top: 8px; }
    .muted { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
    @media print {
      body { background: #fff; padding: 12px; }
      .card { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      ${logo ? `<img class="logo" src="${safeAttrUrl(logo)}" alt="" />` : '<div class="logo"></div>'}
      <div>
        <h1>${escapeHtml(school)}</h1>
        <p class="muted">Fee challan</p>
      </div>
    </div>
    <div class="meta">
      <div class="box"><span class="muted">Challan #</span><div>${escapeHtml(challanNo)}</div></div>
      <div class="box"><span class="muted">Period</span><div>${escapeHtml(periodLabel)}</div></div>
      <div class="box"><span class="muted">Student</span><div>${escapeHtml(student?.full_name || '')}</div></div>
      <div class="box"><span class="muted">Roll no</span><div>${escapeHtml(student?.roll_number || '—')}</div></div>
    </div>
    <div class="box">
      <span class="muted">Amount due</span>
      <div class="amt">${escapeHtml(String(amount))}</div>
    </div>
    <p class="muted" style="margin-top:24px;">Generated digitally — verify with finance office.</p>
  </div>
</body>
</html>`;
}
