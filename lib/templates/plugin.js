import Vue from 'vue';

export default async function (ctx, inject) {

  const { app } = ctx;

  // Module options
  const debug = <%= options.debug || false %>;
  const individualRefresh = <%= options.individualRefresh || false %>;
  const collapseEmptyDivs = <%= options.collapseEmptyDivs || false %>;
  const networkCode = '<%= options.networkCode %>';
  const GPT_LIB_SCRIPT_ID = '<%= options.GPT_LIB_SCRIPT_ID %>';
  const GPT_INIT_SCRIPT_ID = '<%= options.GPT_INIT_SCRIPT_ID %>';

  // Instance options
  const gptAdsOptions = {
    networkCode,
    individualRefresh,
    slots: [],
  };

  const injectScript = (script) => {
    const scriptIndex = ctx.app.head.script.findIndex(s => s.id === script.id);
    if (scriptIndex !== -1) {
      ctx.app.head.script[scriptIndex] = script;
    } else {
      ctx.app.head.script.push(script);
    }
  };

  // Inject GPT lib
  const gptLibScript = {
    id: GPT_LIB_SCRIPT_ID,
    src: 'https://www.googletagservices.com/tag/js/gpt.js',
    async: true,
  };
  injectScript(gptLibScript);

  // Inject GPT init script
  let gptInitScriptHtml = 'var googletag = googletag || {};googletag.cmd = googletag.cmd || [];';
  if (debug) {
    gptInitScriptHtml += 'googletag.cmd.push(function(){googletag.openConsole();});';
  }
  // Disable initial load
  const gptDisableInitialLoad = individualRefresh ? 'googletag.pubads().disableInitialLoad();' : '';
  // Collapse empty div
  const gptCollapseEmptyDivs = collapseEmptyDivs ? 'googletag.pubads().collapseEmptyDivs(true);' : '';
  const inAd = `
      interstitialSlot = googletag.defineOutOfPageSlot(&apos;/123517519/presslogic-web-interstitial&apos;,googletag.enums.OutOfPageFormat.INTERSTITIAL);
      if (interstitialSlot) {
        interstitialSlot.addService(googletag.pubads());
    
        document.getElementById(\x27status\x27).innerText = \x27Interstitial is loading...\x27;
    
        googletag.pubads().addEventListener(\x27slotOnload\x27, function(event) {
        console.log(interstitialSlot.getSlotId().getId())
        console.log(event.slot.getSlotId().getId())
        if (interstitialSlot === event.slot) {
            document.getElementById(\x27link\x27).style.display = \x27block\x27;
            document.getElementById(\x27status\x27).innerText = \x27Interstitial is loaded.\x27;
          }
        });
      }
  `;

  gptInitScriptHtml += `
    googletag.cmd.push(function(){
      ${inAd}
      googletag.pubads().enableSingleRequest();
      ${gptDisableInitialLoad}
      ${gptCollapseEmptyDivs}
      googletag.pubads().setCentering(true);
      googletag.pubads().enableLazyLoad();
      googletag.enableServices();
    });
  `;
  const gptInitScript = {
    id: GPT_INIT_SCRIPT_ID,
    innerHTML: gptInitScriptHtml,
  };
  injectScript(gptInitScript);

  const component = require('./component.js');
  Vue.component('<%= options.componentName %>', component.default || component);

  ctx.$gptAds = gptAdsOptions;
  inject('gptAds', gptAdsOptions);
}
