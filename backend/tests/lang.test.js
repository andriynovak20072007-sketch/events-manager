// Mock browser environment for plain Node.js test environment
let mockStore = {};
global.localStorage = {
  getItem: jest.fn(key => mockStore[key] || null),
  setItem: jest.fn((key, value) => {
    mockStore[key] = value.toString();
  }),
  clear: jest.fn(() => {
    mockStore = {};
  })
};

// Custom lightweight DOM Node simulation
class MockNode {
  constructor(nodeType, tagName = '', textContent = '') {
    this.nodeType = nodeType;
    this.tagName = tagName.toUpperCase();
    this.nodeValue = textContent;
    this._textContent = textContent;
    this.childNodes = [];
    this.attributes = {};
    this.parentElement = null;
    this.classList = {
      classes: new Set(),
      add(cls) { this.classes.add(cls); },
      remove(cls) { this.classes.delete(cls); },
      contains(cls) { return this.classes.has(cls); }
    };
  }

  get textContent() {
    if (this.nodeType === 3) return this.nodeValue;
    if (this.childNodes.length > 0) {
      return this.childNodes.map(c => c.textContent).join('');
    }
    return this._textContent;
  }

  set textContent(val) {
    if (this.nodeType === 3) {
      this.nodeValue = val;
    } else {
      this._textContent = val;
      const child = new MockNode(3, '', val);
      child.parentElement = this;
      this.childNodes = [child];
    }
  }

  get innerHTML() {
    return this.textContent;
  }

  set innerHTML(val) {
    this.textContent = val.replace(/<[^>]*>/g, '').trim();
  }

  hasAttribute(name) {
    return name in this.attributes;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  appendChild(node) {
    node.parentElement = this;
    this.childNodes.push(node);
  }
}

// Document Mocking Hooks
let querySelectorMock = jest.fn(() => null);
let querySelectorAllMock = jest.fn(() => []);

global.document = {
  body: new MockNode(1, 'body'),
  querySelector: querySelectorMock,
  querySelectorAll: querySelectorAllMock,
  addEventListener: jest.fn()
};

global.window = {
  dispatchEvent: jest.fn()
};
global.Event = function() {};

// Require lang module after mocks are established
const langModule = require('../../frontend/css/lang.js');
const { translations, applyLanguage, applyCurrency, setCurrency, walkAndTranslate } = langModule;

describe('Language translation unit tests (lang.js)', () => {
  beforeEach(() => {
    mockStore = {};
    jest.clearAllMocks();
    querySelectorMock.mockReturnValue(null);
    querySelectorAllMock.mockReturnValue([]);
  });

  describe('applyLanguage()', () => {
    it('TC-L01: should save language code to localStorage', () => {
      applyLanguage('en');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('language', 'en');
    });

    it('TC-L02: should update button UI text with standard icon', () => {
      const languageBtn = new MockNode(1, 'div');
      languageBtn.textContent = 'UA';
      querySelectorMock.mockReturnValue(languageBtn);

      applyLanguage('en');

      expect(languageBtn.textContent).toContain('EN');
    });

    it('TC-L03: should toggle active class on language dropdown option matching the active lang', () => {
      const optUA = new MockNode(1, 'button');
      optUA.textContent = 'UA - Українська';
      const optEN = new MockNode(1, 'button');
      optEN.textContent = 'EN - English';

      querySelectorAllMock.mockReturnValue([optUA, optEN]);

      applyLanguage('en');

      expect(optUA.classList.contains('active')).toBe(false);
      expect(optEN.classList.contains('active')).toBe(true);
    });
  });

  describe('walkAndTranslate()', () => {
    it('TC-L04: should recursively translate matching text nodes to English', () => {
      const root = new MockNode(1, 'div');
      const textNode = new MockNode(3, '', 'Оберіть свій план');
      root.appendChild(textNode);

      walkAndTranslate(root, 'en');

      expect(textNode.nodeValue).toBe('Choose your plan');
    });

    it('TC-L05: should revert translated elements back to Ukrainian correctly', () => {
      const root = new MockNode(1, 'div');
      const textNode = new MockNode(3, '', 'Оберіть свій план');
      root.appendChild(textNode);

      // Translate to English first
      walkAndTranslate(root, 'en');
      expect(textNode.nodeValue).toBe('Choose your plan');

      // Revert back to Ukrainian
      walkAndTranslate(root, 'ua');
      expect(textNode.nodeValue).toBe('Оберіть свій план');
    });

    it('TC-L06: should translate placeholder attributes dynamically', () => {
      const input = new MockNode(1, 'input');
      input.setAttribute('placeholder', 'Пошук подій ...');

      walkAndTranslate(input, 'en');
      expect(input.getAttribute('placeholder')).toBe('Search events ...');

      walkAndTranslate(input, 'ua');
      expect(input.getAttribute('placeholder')).toBe('Пошук подій ...');
    });

    it('TC-L07: should translate input type button value', () => {
      const input = new MockNode(1, 'input');
      input.tagName = 'INPUT';
      input.type = 'button';
      input.value = 'Подати заявку';

      walkAndTranslate(input, 'en');
      expect(input.value).toBe('Submit application');

      walkAndTranslate(input, 'ua');
      expect(input.value).toBe('Подати заявку');
    });
  });

  describe('applyCurrency()', () => {
    it('TC-C01: should convert UAH pricing values to USD and format with symbol', () => {
      const priceSpan = new MockNode(1, 'span', '1000 ₴');
      querySelectorAllMock.mockReturnValue([priceSpan]);
      
      mockStore['currency'] = 'usd';
      applyCurrency();

      expect(priceSpan.textContent).toBe('24 $');
      expect(priceSpan.getAttribute('data-orig-price')).toBe('1000');
    });

    it('TC-C02: should convert UAH pricing values to EUR and format with symbol', () => {
      const priceSpan = new MockNode(1, 'span', '1000 ₴');
      querySelectorAllMock.mockReturnValue([priceSpan]);
      
      mockStore['currency'] = 'eur';
      applyCurrency();

      expect(priceSpan.textContent).toBe('22 €');
    });

    it('TC-C03: should correctly toggle between multiple currencies without compounding the conversion', () => {
      const priceSpan = new MockNode(1, 'span', '1000 ₴');
      querySelectorAllMock.mockReturnValue([priceSpan]);

      // Translate to USD first
      mockStore['currency'] = 'usd';
      applyCurrency();
      expect(priceSpan.textContent).toBe('24 $');

      // Re-translate to EUR, ensuring it does not multiply 24 by the rate
      mockStore['currency'] = 'eur';
      applyCurrency();
      expect(priceSpan.textContent).toBe('22 €');
    });

    it('TC-C04: should handle different spelling variations like грн or UAH', () => {
      const priceSpan = new MockNode(1, 'span', '500 грн');
      querySelectorAllMock.mockReturnValue([priceSpan]);

      mockStore['currency'] = 'usd';
      applyCurrency();
      expect(priceSpan.textContent).toBe('12 $');
    });
  });

  describe('setCurrency()', () => {
    it('TC-L08: should save currency choice to localStorage', () => {
      setCurrency('usd');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('currency', 'usd');
    });
  });
});
