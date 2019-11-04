export default {
  name: '<%= options.componentName %>',
  data: () => ({
    adSlot: null,
    mapping: [],
    currentSizeMappingIndex: null,
    windowResizeListenerDebounce: null,
    ghostMode: <%= options.ghostMode %>,
  }),
  props: {
    adUnit: {
      type: String,
      required: true,
    },
    size: {
      type: [Array, String],
      required: true,
    },
    sizeMapping: {
      type: Array,
      required: false,
      default: () => [],
    },
    id: {
      type: [Number, String],
      required: false,
      default: () => Math.random().toString(36).substring(5),
    },
    isResponsive: {
      type: Boolean,
      required: false,
      default: <%= options.responsive %>,
    },
    windowResizeDebounce: {
      type: Number,
      required: false,
      default: 300,
    },
    collapseEmptyDiv: {
      type: Boolean,
      required: false,
      default: null,
    },
    page: {
      type: Object,
      required: true,
      default: null,
    },
    categories: {
      type: Array,
      required: true,
      default: [],
    },
    article: {
      type: Object,
      required: true,
      default: null,
    }
  },
  computed: {
    networkCode() {
      const { $gptAds } = this;
      return $gptAds ? $gptAds.networkCode : null;
    },
    adUnitPath() {
      const { networkCode, adUnit } = this;
      return `/${networkCode}/${adUnit}`;
    },
    divId() {
      const { id } = this;
      return `div-gpt-ad-${id}-0`;
    },
    formattedSize() {
      return this.formatSizeList(this.size);
    },
    style() {
      if (this.ghostMode) {
        const { formattedSize, currentSizeMappingIndex, mapping } = this;
        let baseSize = formattedSize;
        if (currentSizeMappingIndex !== null) {
          baseSize = mapping[currentSizeMappingIndex][1];
        }
        const size = Array.isArray(baseSize[0]) ? baseSize[0] : [baseSize[0], baseSize[1]];
        const [width, height] = size;
        return {
          margin: '0 auto',
          width: `${width}px`,
          height: `${height}px`,
          border: '1px solid black',
        };
      }
      return null;
    },
  },
  methods: {
    /**
     * Formats a given size to make it compatible with GPT
     * If size is an Array, it is returned as is
     * If size is a string, it is formatted so that 123x456 becomes [123, 456]
     *
     * @param      {Array,string}  size    The size
     * @return     {Array} Formatted size
     */
    formatSize(size) {
      if (Array.isArray(size)) {
        return size;
      }
      if (typeof size === 'string') {
        return size.split('x').map(value => parseInt(value, 10));
      }
      return [];
    },
    /**
     * Formats a given list of sizes to make it compatible with GPT API
     * If sizesList is an Array, it is returned as is
     * If sizesList is a string, it is formatted so that
     * 123x456,654x321 becomes [[123, 456], [654, 321]]
     *
     * @param      {Array,string}  sizesList  The sizes
     * @return     {Array} Formatted sizes list
     */
    formatSizeList(sizesList) {
      if (Array.isArray(sizesList)) {
        return sizesList;
      }
      if (typeof sizesList === 'string') {
        return sizesList
          .split(',')
          .map(size => this.formatSize(size));
      }
      return [];
    },
    /**
     * Refresh ad slot
     */
    refreshSlot() {
      googletag.pubads().refresh([this.adSlot]);
    },
    /**
     * Window resize event listener
     * Attached only when responsive mode is enabled, it checks wether a different size
     * mapping can be activated after resize and forces the slot to be refreshed if it's
     * the case
     */
    handleWindowResize() {
      const { windowResizeDebounce } = this;
      clearTimeout(this.windowResizeListenerDebounce);
      this.windowResizeListenerDebounce = setTimeout(() => {
        const currentSizeMappingIndex = this.getCurrentSizeMappingIndex();
        if (currentSizeMappingIndex !== this.currentSizeMappingIndex) {
          if (!this.ghostMode) {
            this.refreshSlot();
          }
          this.currentSizeMappingIndex = currentSizeMappingIndex;
        }
      }, windowResizeDebounce);
    },
    /**
     * Gets the current size mapping index
     *
     * @return     {Number}  The current size mapping index
     */
    getCurrentSizeMappingIndex() {
      const mapping = this.mapping || [];
      let index = null;
      mapping.some((size, i) => {
        const [browserSize] = size;
        const [width, height] = browserSize;
        const mediaQuery = `(min-width: ${width}px) and (min-height: ${height}px)`;
        if (window.matchMedia(mediaQuery).matches) {
          index = i;
          return true;
        }
        return false;
      });
      return index;
    },
  },
  mounted() {
    if (!window.googletag) {
      return;
    }
    const {
      ghostMode,
      adUnitPath,
      divId,
      sizeMapping,
      isResponsive,
      collapseEmptyDiv,
      page,
      categories,
      article
    } = this;

    var screenWidth = window ? window.innerWidth : null;

    // Init Ad slot
    googletag.cmd.push(() => {
      const adSlot = googletag
        .defineSlot(adUnitPath, this.formattedSize, divId)
        .addService(googletag.pubads());

      // Collapse empty div slot-level override
      if (collapseEmptyDiv !== null) {
        adSlot.setCollapseEmptyDiv(collapseEmptyDiv);
      }

      // set targeting subdomain
      if (page !== null) {
          adSlot.setTargeting('subdomain', page.subdomain);
      }

      // set targeting post_id
      if (page !== null || article !== null) {
          adSlot.setTargeting('post_id', page.post_id || article.id);
      }
      // set targeting env
      if (page !== null ) {
          adSlot.setTargeting('env', page.env);
      }

      // set targeting page type
      if (page !== null ) {
        adSlot.setTargeting('page_type', page.pageType);
      }

      // set targeting inskin_desktop_yes
      adSlot.setTargeting('inskin_desktop_yes', "false");
      if(screenWidth !== null) {
        adSlot.setTargeting('inskin_desktop_yes', screenWidth >= 1345 ? 'true' : 'false');
      }

      // set targeting inskin_mobile_yes
      var inskin_mobile_yes = "false";
      adSlot.setTargeting('inskin_mobile_yes', inskin_mobile_yes);
      if(screenWidth !== null) {
        var threshold = 375;
        if (screenWidth >= threshold) { //CHECKS IF IMPRESSION IS RUN ON SUPPORTED BROWSERS/VERSIONS
            var reg_safari = /^(?=.*(Safari))(?!.*(Chrome|CriOS)).*$/igm;
            var reg_chrome = /(?!.*OPR).(?=.*Safari)((Chrome|CriOS)[\/\s](\d{1,}([\.][\.A-Za-z0-9]{1,})))/igm;
            var reg_fb = /FBAV\//igm;
            if (reg_safari.test(navigator.userAgent) || reg_fb.test(navigator.userAgent) || reg_chrome.test(navigator.userAgent)) {
              inskin_mobile_yes = "true";
            }
        }
        adSlot.setTargeting('inskin_mobile_yes', inskin_mobile_yes);
      }

      // set targeting adDemoKey and adDemoVal
      if (page !== null && page.ad_demo_key !== null) {
          adSlot.setTargeting(page.ad_demo_key, page.ad_demo_val);
      }

      const categoriesMap = categoriesToMap(categories)
      // set targeting category
      if(article !== null) {
        adSlot.setTargeting('category', categoryToString(categoriesMap, article.cats));
      }

      // set targeting tags
      if(article !== null) {
        adSlot.setTargeting('tag', tagToString(article.tags));
      }

      // Build size mapping if any
      if (sizeMapping.length > 0) {
        const mapping = googletag.sizeMapping();
        sizeMapping.forEach((size) => {
          const browserSize = this.formatSize(size[0]);
          const adSizes = this.formatSizeList(size[1]);
          mapping.addSize(browserSize, adSizes);
          this.mapping.push([browserSize, adSizes]);
        });
        adSlot.defineSizeMapping(mapping.build());
      }

      // Init responsive behavior
      if (this.sizeMapping.length > 0 && isResponsive) {
        const currentSizeMappingIndex = this.getCurrentSizeMappingIndex();
        this.currentSizeMappingIndex = currentSizeMappingIndex;
        window.addEventListener('resize', this.handleWindowResize);
      }

      this.adSlot = adSlot;
      this.$gptAds.slots.push(adSlot);

      if (!this.ghostMode) {
        googletag.display(divId);
        if (this.$gptAds.individualRefresh) {
          this.refreshSlot();
        }
      }
    });
  },
  beforeDestroy() {
    if (!googletag) {
      return;
    }
    // Destroy ad slot
    googletag.cmd.push(() => {
      const destroyed = googletag.destroySlots([this.adSlot]);
    });
    // Remove window resize listener
    window.removeEventListener('resize', this.handleWindowResize);
  },
  render(h) {
    const { divId, style } = this;

    return h('div', {
      style,
      attrs: {
        id: divId,
      },
      domProps: { innerHTML: '' },
    });
  },
};

function categoryToString(catsMap = {},arr = []) {
  let returnVal = ',';
  for(let i=0; i<arr.length; i++){
    const cat = arr[i]
    const parent = catsMap[cat.id]
    if(!!parent) {
      returnVal += parent.name + ',';
    } 
    returnVal += cat.name + ',';
  }

  return returnVal;
}

function tagToString(arr = []) {
    let returnVal = ',';
    for(let i=0; i<arr.length; i++){
      const name = arr[i].name.trim();
      if(name === '') continue;
      returnVal += name + ',';
    }

    return returnVal;
}

function categoriesToMap(categories = []) {
  return categories.reduce(function(acc, curr){
    if(curr.subcategories && curr.subcategories.length) {
      return curr.subcategories.reduce(function(subAcc, subCurr) {
        subAcc[`${subCurr.id}`] = curr
        return subAcc
      }, acc)
    }

    return acc;
  }, {});
}