// ==UserScript==
// @name         80亿分之1：自选出生国家与家境
// @namespace    local.rea.country-picker
// @version      1.2.0
// @description  在出生前选择模拟角色的出生国家与家庭收入分位
// @match        https://1in8b.life/zh-hans/
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  const key = 'rea.country-picker.birth-country';
  const familyKey = 'rea.country-picker.family-quintile';

  function install() {
    const home = document.querySelector('#homeSel');
    const start = window.startNewLife;
    const create = window.newLife;
    if (!home || typeof start !== 'function' || typeof create !== 'function' ||
        typeof window.ethQ !== 'function' || typeof window.casteQ !== 'function' ||
        typeof window.royalDraw !== 'function') {
      setTimeout(install, 250);
      return;
    }
    if (document.querySelector('#reaFamilyQuintile')) return;

    let select = document.querySelector('#reaBirthCountry');
    let group = select?.closest('.optgroup');
    if (!select) {
    group = document.createElement('div');
    group.className = 'optgroup';
    const label = document.createElement('label');
    label.className = 'lbl';
    label.htmlFor = 'reaBirthCountry';
    label.textContent = '模拟角色出生的国家或地区';
    select = home.cloneNode(true);
    select.id = 'reaBirthCountry';
    select.removeAttribute('aria-label');
    select.replaceChildren(...Array.from(select.options).filter(option => option.value));
    select.prepend(new Option('按原规则随机', ''));
    const saved = localStorage.getItem(key);
    if (saved && Array.from(select.options).some(option => option.value === saved)) {
      select.value = saved;
    }
    select.addEventListener('change', () => localStorage.setItem(key, select.value));
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = '只改变这次模拟的出生地；下方“你实际出生的国家或地区”用于对照。';
    group.append(label, select, hint);
    home.closest('.optgroup').before(group);
    }

    const familyGroup = document.createElement('div');
    familyGroup.className = 'optgroup';
    const familyLabel = document.createElement('label');
    familyLabel.className = 'lbl';
    familyLabel.htmlFor = 'reaFamilyQuintile';
    familyLabel.textContent = '模拟角色的家境';
    const family = document.createElement('select');
    family.id = 'reaFamilyQuintile';
    family.className = 'sel';
    [
      ['', '按原规则随机'],
      ['1', '第1分位 · 国内最贫穷的20%'],
      ['2', '第2分位 · 国内后20～40%'],
      ['3', '第3分位 · 国内中间的20%'],
      ['4', '第4分位 · 国内前20～40%'],
      ['5', '第5分位 · 国内最富裕的20%'],
    ].forEach(([value, name]) => family.add(new Option(name, value)));
    const savedFamily = localStorage.getItem(familyKey);
    if (['1', '2', '3', '4', '5'].includes(savedFamily)) family.value = savedFamily;
    family.addEventListener('change', () => localStorage.setItem(familyKey, family.value));
    const familyHint = document.createElement('span');
    familyHint.className = 'hint';
    familyHint.textContent = '选择家庭收入层级；父母职业、年龄和宗教等仍由游戏生成。';
    familyGroup.append(familyLabel, family, familyHint);
    group.after(familyGroup);

    window.startNewLife = function (...args) {
      const country = select.value;
      const quintile = Number(family.value);
      if (!country && !quintile) {
        return start.apply(this, args);
      }
      const original = window.newLife;
      const originalEthQ = window.ethQ;
      const originalCasteQ = window.casteQ;
      const originalRoyalDraw = window.royalDraw;
      window.newLife = function (mode, pace, selectedCountry, era) {
        return original.call(this, mode, pace, country || selectedCountry, era);
      };
      if (quintile) {
        window.ethQ = () => quintile;
        window.casteQ = () => quintile;
        if (quintile < 5) window.royalDraw = () => null;
      }
      try {
        return start.apply(this, args);
      } finally {
        window.newLife = original;
        window.ethQ = originalEthQ;
        window.casteQ = originalCasteQ;
        window.royalDraw = originalRoyalDraw;
      }
    };
  }

  install();
})();
