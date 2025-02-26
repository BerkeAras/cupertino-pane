import { Support } from './support';
import { Device } from './device';
import { Settings } from './models';
export type CupertinoSettings = Partial<Settings>;

export class CupertinoPane {

  public settings: Settings = {
    initialBreak: 'middle',
    parentElement: null,
    followerElement: null,
    backdrop: false,
    backdropOpacity: 0.4, 
    animationType: 'ease',
    animationDuration: 300,
    dragBy: null,
    bottomOffset: 0,
    darkMode: false,
    bottomClose: false,
    freeMode: false,
    buttonClose: true,
    topperOverflow: true,
    topperOverflowOffset: 0,
    lowerThanBottom: true,
    showDraggable: true,
    draggableOver: false,
    clickBottomOpen: true,
    simulateTouch: true,
    passiveListeners: true,
    breaks: {},
    onDidDismiss: () => {},
    onWillDismiss: () => {},
    onDidPresent: () => {},
    onWillPresent: () => {},
    onDragStart: () => {},
    onDrag: () => {},
    onDragEnd: () => {},
    onBackdropTap: () => {},
    onTransitionStart: () => {},
    onTransitionEnd: () => {}
  };

  private defaultBreaksConf = {
    top: { enabled: true, height: window.innerHeight - (135 * 0.35)},
    middle: { enabled: true, height: 300},
    bottom: { enabled: true, height: 100},
  };
  private screen_height: number = window.innerHeight;
  private steps: any[] = [];
  private startP: any;
  private pointerDown: boolean = false;
  private topper: number;
  private bottomer: number;
  private currentBreakpoint: number;
  private contentScrollTop: number = 0;
  private draggableScrollOffset: number = 0;
  private disableDragEvents: boolean = false;

  private breaks: {} = {}
  private brs: number[] = [];
  
  private el: HTMLElement;
  private parentEl: HTMLElement;
  private wrapperEl: HTMLDivElement;
  private paneEl: HTMLDivElement;
  private draggableEl: HTMLDivElement;
  private moveEl: HTMLDivElement;
  private contentEl: HTMLElement;
  private backdropEl: HTMLDivElement;
  private closeEl: HTMLDivElement;
  private overflowEl: HTMLElement;
  private followerEl: HTMLElement;

  private device = new Device();

  constructor(private selector: string, conf: CupertinoSettings = {}) {
    // Unable attach DOM element
    if (!<HTMLElement>document.querySelector(this.selector)) {
      console.warn('Cupertino Pane: wrong selector specified', this.selector);
      return;
    }
    
    // Pane already was rendered
    if (this.isPanePresented()) {
      console.warn('Cupertino Pane: specified selector already in use', this.selector);
      return;
    }

    this.el = <HTMLElement>document.querySelector(this.selector);
    this.el.style.display = 'none';
    this.settings = {...this.settings, ...conf};
    
    if (this.settings.parentElement) {
      this.settings.parentElement = <HTMLElement>document.querySelector(
        this.settings.parentElement
      );
    } else {
      this.settings.parentElement = this.el.parentElement;
    }
  }

  private drawElements() {
      this.parentEl = this.settings.parentElement;
      
      // Body patch prevent android pull-to-refresh
      document.body.style.overscrollBehaviorY = 'none';  
    
      // Wrapper
      this.wrapperEl = document.createElement('div');
      this.wrapperEl.className = `cupertino-pane-wrapper ${this.el.className}`;
      this.wrapperEl.style.position = 'absolute';
      this.wrapperEl.style.top = '0';
      this.wrapperEl.style.left = '0';

      // Panel
      this.paneEl = document.createElement('div');
      this.paneEl.className = 'pane';
      this.paneEl.style.position = 'fixed';
      this.paneEl.style.zIndex = '11';
      this.paneEl.style.paddingTop = '15px';
      this.paneEl.style.width = '100%';
      this.paneEl.style.maxWidth = '500px';
      this.paneEl.style.left = '0px';
      this.paneEl.style.right = '0px';
      this.paneEl.style.marginLeft = 'auto';
      this.paneEl.style.marginRight = 'auto';
      this.paneEl.style.height = `${this.screen_height - this.topper - this.settings.bottomOffset}px`;
      this.paneEl.style.background = '#ffffff';
      this.paneEl.style.borderTopLeftRadius = '20px';
      this.paneEl.style.borderTopRightRadius = '20px';
      this.paneEl.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)';
      this.paneEl.style.overflow = 'hidden';
      this.paneEl.style.willChange = 'transform';
      this.paneEl.style.transform = `translateY(${this.breaks[this.settings.initialBreak]}px) translateZ(0px)`;

      // Draggable
      this.draggableEl = document.createElement('div');
      this.draggableEl.className = 'draggable';
      this.draggableEl.style.padding = '5px';
      this.draggableEl.style.position = 'absolute';
      this.draggableEl.style.top = '0';
      this.draggableEl.style.left = '0';
      this.draggableEl.style.right = '0';
      this.draggableEl.style.marginLeft = 'auto';
      this.draggableEl.style.marginRight = 'auto';
      this.draggableEl.style.height = '30px';
      this.draggableEl.style.zIndex = '12';

      // Move
      this.moveEl = document.createElement('div');
      this.moveEl.className = 'move';
      this.moveEl.style.margin = '0 auto';
      this.moveEl.style.height = '5px';
      this.moveEl.style.background = '#c0c0c0';
      this.moveEl.style.width = '36px';
      this.moveEl.style.borderRadius = '4px';

      // Content
      this.contentEl = this.el;
      this.contentEl.style.display = 'block';
      this.contentEl.style.transition = `opacity ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
      this.contentEl.style.overflowX = 'hidden';

      // Backdrop
      this.backdropEl = document.createElement('div');
      this.backdropEl.className = 'backdrop';
      this.backdropEl.style.overflow = 'hidden';
      this.backdropEl.style.position = 'fixed';
      this.backdropEl.style.width = '100%';
      this.backdropEl.style.bottom = '0';
      this.backdropEl.style.right = '0';
      this.backdropEl.style.left = '0';
      this.backdropEl.style.top = '0';
      this.backdropEl.style.transition = `all ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
      this.backdropEl.style.backgroundColor = `rgba(0,0,0, ${this.settings.backdropOpacity})`;
      this.backdropEl.style.display = 'none';
      this.backdropEl.style.zIndex = '10';

      // Close button
      this.closeEl = document.createElement('div');
      this.closeEl.className = 'close-button';
      this.closeEl.style.width = '26px';
      this.closeEl.style.height = '26px';
      this.closeEl.style.position = 'absolute';
      this.closeEl.style.background = '#ebebeb';
      this.closeEl.style.top = '16px';
      this.closeEl.style.right = '20px';
      this.closeEl.style.borderRadius = '100%';
  }

  present(conf: {animate: boolean} = {animate: false}) {
      if (!this.el) return;

      // Pane already was rendered
      if (this.isPanePresented()) {
        this.moveToBreak(this.settings.initialBreak);
        return;
      }

      // Emit event
      this.settings.onWillPresent();

      this.breaks = {
        top: this.screen_height,
        middle: this.screen_height,
        bottom: this.screen_height
      };
      
      ['top', 'middle', 'bottom'].forEach((val) => {
        // bottom offset for bulletins
        this.breaks[val] -= this.settings.bottomOffset;

        // Set default if no exist
        if (!this.settings.breaks[val]) {
          this.settings.breaks[val] = this.defaultBreaksConf[val];
        }
  
        // Add offsets (offset or height, later need remove ofsfset)
        if (this.settings.breaks[val]
            && this.settings.breaks[val].enabled
            && (this.settings.breaks[val].offset || this.settings.breaks[val].height)) {
          this.breaks[val] -= (this.settings.breaks[val].offset || this.settings.breaks[val].height);
        }
      });

      // Warnings 
      if (!this.settings.breaks[this.settings.initialBreak].enabled) {
        console.warn('Cupertino Pane: Please set initialBreak for enabled breakpoint');
      }
      if (this.settings.breaks['middle'].height >= this.settings.breaks['top'].height) {
        console.warn('Cupertino Pane: Please set middle height lower than top height');
      }
      if (this.settings.breaks['middle'].height <= this.settings.breaks['bottom'].height) {
        console.warn('Cupertino Pane: Please set bottom height lower than middle height');
      }

      // Prepare breakpoint numbers array
      this.brs = [];
      ['top', 'middle', 'bottom'].forEach((val) => {
        if (this.settings.breaks[val].enabled) {
          this.brs.push(this.breaks[val]);
        }
      });

      // Determinate topper point
      this.topper = this.brs.reduce((prev, curr) => {
        return (Math.abs(curr) < Math.abs(prev) ? curr : prev);
      });
      // Determinate bottomer point
      this.bottomer = this.brs.reduce((prev, curr) => {
        return (Math.abs(curr) > Math.abs(prev) ? curr : prev);
      });

      this.currentBreakpoint = this.breaks[this.settings.initialBreak];

      this.drawElements();
      this.parentEl.appendChild(this.wrapperEl);
      this.wrapperEl.appendChild(this.paneEl);
      this.paneEl.appendChild(this.draggableEl);
      this.paneEl.appendChild(this.contentEl);
      this.draggableEl.appendChild(this.moveEl);

      if (this.settings.followerElement) {
        if (!<HTMLElement>document.querySelector(this.settings.followerElement)) {
          console.warn('Cupertino Pane: wrong follower element selector specified', this.settings.followerElement);
          return;
        }

        this.followerEl = <HTMLElement>document.querySelector(
          this.settings.followerElement
        );
        this.followerEl.style.willChange = 'transform, border-radius';
        this.followerEl.style.transform = `translateY(0px) translateZ(0px)`;
        this.followerEl.style.transition = `all ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
      }

      if (!this.settings.showDraggable) {
        this.draggableEl.style.opacity = '0';
      }

      // Draggable over pane position
      if (this.settings.draggableOver) {
        this.paneEl.style.background = 'transparent';
        this.paneEl.style.boxShadow = 'none';
        this.paneEl.style.paddingTop = '30px';

        this.contentEl.style.background = '#ffffff';
        this.contentEl.style.display = 'block';
        this.contentEl.style.borderTopLeftRadius = '20px';
        this.contentEl.style.borderTopRightRadius = '20px';
        this.contentEl.style.boxShadow = '0 4px 16px rgba(0,0,0,.12)';

        this.closeEl.style.top = '45px';

        this.draggableEl.style.padding = '15px';

        this.moveEl.style.width = '45px';
        this.moveEl.style.background = 'rgba(225, 225, 225, 0.6)';
        if (Support.backdropFilter) {
          this.moveEl.style['backdropFilter'] = 'saturate(180%) blur(20px)';
          this.moveEl.style['webkitBackdropFilter'] = 'saturate(180%) blur(20px)';
        }
      }

      if (this.settings.darkMode) {
        this.paneEl.style.background = '#1c1c1d';
        this.paneEl.style.color = '#ffffff';
        this.moveEl.style.background = '#5a5a5e';
      }

      if (this.settings.buttonClose) {
        this.paneEl.appendChild(this.closeEl);
        this.closeEl.addEventListener('click', (t) => this.destroy({animate:true}));
        let iconColor = '#7a7a7e';
        if (this.settings.darkMode) {
          this.closeEl.style.background = '#424246';
          iconColor = '#a8a7ae';
        }
        this.closeEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path fill="${iconColor}" d="M278.6 256l68.2-68.2c6.2-6.2 6.2-16.4 0-22.6-6.2-6.2-16.4-6.2-22.6 0L256 233.4l-68.2-68.2c-6.2-6.2-16.4-6.2-22.6 0-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3l68.2 68.2-68.2 68.2c-3.1 3.1-4.7 7.2-4.7 11.3 0 4.1 1.6 8.2 4.7 11.3 6.2 6.2 16.4 6.2 22.6 0l68.2-68.2 68.2 68.2c6.2 6.2 16.4 6.2 22.6 0 6.2-6.2 6.2-16.4 0-22.6L278.6 256z"/>
        </svg>`;
      }

      if (this.settings.bottomClose) {
        this.settings.breaks.bottom.enabled = true;
      }

      if (this.settings.backdrop) {
        this.wrapperEl.appendChild(this.backdropEl);
        this.backdropEl.style.display = 'block';
        this.backdropEl.addEventListener('click', (t) => this.settings.onBackdropTap());
      }

      this.scrollElementInit();
      this.checkOpacityAttr(this.currentBreakpoint);
      this.checkOverflowAttr(this.currentBreakpoint);

      /****** Attach Events *******/
      if (!this.settings.dragBy) {
        this.attachEvents(this.paneEl);
      } else {
        this.settings.dragBy.forEach((selector) => {
          const el = document.querySelector(selector);
          if (el) this.attachEvents(el);
        });
      }

      /****** Animation & Transition ******/
      if (conf.animate) {
        this.doTransition({type: 'present', translateY: this.breaks[this.settings.initialBreak]}); 
      } else {
        // Emit event
        this.settings.onDidPresent();
      }
  }

  /**
   * Private Utils methods
   */

  private scrollElementInit() {
    let attrElements = document.querySelectorAll(`${this.selector} [overflow-y]`);
    if (!attrElements.length || attrElements.length > 1) {
      this.overflowEl = this.contentEl;
    } else {
      this.overflowEl = <HTMLElement>attrElements[0];
    }
    
    if (this.settings.topperOverflow) {       
      // Good to get rid of timeout
      // but render dom take a time  
      setTimeout(() => {
        this.overflowEl.style.height = `${this.screen_height 
          - this.topper 
          - this.settings.bottomOffset
          - this.settings.topperOverflowOffset
          - this.overflowEl.offsetTop}px`;
      }, 150);
    }
  }

  private checkOpacityAttr(val) {
    let attrElements = document.querySelectorAll(`${this.selector} [hide-on-bottom]`);
    if (!attrElements.length) return;
    attrElements.forEach((item) => {
      (<HTMLElement>item).style.transition = `opacity ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
      (<HTMLElement>item).style.opacity = (val >= this.breaks['bottom']) ? '0' : '1';
    });
  }

  private checkOverflowAttr(val) {
    if (!this.settings.topperOverflow) return;
    this.overflowEl.style.overflowY = (val <= this.topper) ? 'auto' : 'hidden';
  }

  private isPanePresented():boolean {
    return document.querySelector(`.cupertino-pane-wrapper ${this.selector}`) 
    ? true : false;
  }

  /** 
   * Check if drag event fired by scrollable element
   */
  private isDragScrollabe(path):boolean {
    return !!path.find(item => item === this.overflowEl);
  }

  /**
   * Touch Start Event
   * @param t 
   */
  private touchStartCb = (t) => this.touchStart(t);
  private touchStart(t) {
    // Event emitter
    this.settings.onDragStart(t as CustomEvent);

    if (this.disableDragEvents) return;

    const targetTouch = t.type === 'touchstart' && t.targetTouches && (t.targetTouches[0] || t.changedTouches[0]);
    const screenY = t.type === 'touchstart' ? targetTouch.screenY : t.screenY;
    if (t.type === 'mousedown') this.pointerDown = true;

    this.startP = screenY;

    // if overflow content was scrolled
    // increase to scrolled value
    if (this.isDragScrollabe(t.path || t.composedPath())) {
      this.startP += this.contentScrollTop;  
    } 
    this.steps.push(this.startP);
  }

  /** 
   * Touch Move Event
   * @param t 
   */
  private touchMoveCb = (t) => this.touchMove(t);
  private touchMove(t) {
    // Event emitter
    this.settings.onDrag(t as CustomEvent);

    if (this.disableDragEvents) return;

    // Handle desktop/mobile events
    const targetTouch = t.type === 'touchmove' && t.targetTouches && (t.targetTouches[0] || t.changedTouches[0]);
    const screenY = t.type === 'touchmove' ? targetTouch.screenY : t.screenY;
    if(t.type === 'mousemove' && !this.pointerDown) return;
    
    // Delta
    let n = screenY;
    const diff = n - this.steps[this.steps.length - 1];
    const newVal = this.getPanelTransformY() + diff;

    // Not allow move panel with positive overflow scroll
    if (this.isDragScrollabe(t.path || t.composedPath()) 
          && this.overflowEl.style.overflowY === 'auto') {
      this.overflowEl.addEventListener('scroll', (s: any) => {
        this.contentScrollTop = s.target.scrollTop;
      });
      // Scrolled -> Disable drag
      if ((newVal > this.topper && this.contentScrollTop > 0) 
          || (newVal <= this.topper)) { 
        return;
      } 
    }

    // Not allow drag upper than topper point
    // Not allow drag lower than bottom if free mode
    if ((newVal <= this.topper)
        || (this.settings.freeMode && !this.settings.bottomClose && (newVal >= this.bottomer))) {
      return;
    }

    // Custom Lower then bottom 
    // (for example in follower drag events)
    if (!this.settings.lowerThanBottom && (newVal >= this.bottomer)) {
      this.destroy({animate:true});
      return;
    }

    this.checkOpacityAttr(newVal);
    this.checkOverflowAttr(newVal);
    this.doTransition({type: 'move', translateY: newVal});
    this.steps.push(n);
  }

  /**
   * Touch End Event
   * @param t 
   */
  private touchEndCb = (t) => this.touchEnd(t);
  private touchEnd(t) {

    // Event emitter
    this.settings.onDragEnd(t as CustomEvent);

    if (this.disableDragEvents) return;

    const targetTouch = t.type === 'touchmove' && t.targetTouches && (t.targetTouches[0] || t.changedTouches[0]);
    const screenY = t.type === 'touchmove' ? targetTouch.screenY : t.screenY;
    if (t.type === 'mouseup') this.pointerDown = false;

    // Determinate nearest point
    let closest = this.brs.reduce((prev, curr) => {
      return (Math.abs(curr - this.getPanelTransformY()) < Math.abs(prev - this.getPanelTransformY()) ? curr : prev);
    });

    // Swipe - next (if differ > 10)
    const diff =  this.steps[this.steps.length - 1] - this.steps[this.steps.length - 2];
    // Set sensivity lower for web
    const swipeNextSensivity = window.hasOwnProperty('cordova') ? 4 : 3; 
    if (Math.abs(diff) >= swipeNextSensivity) {
      closest = this.swipeNextPoint(diff, swipeNextSensivity, closest);
    }

    // Click to bottom - open middle
    if (this.settings.clickBottomOpen) {
      if (this.currentBreakpoint === this.breaks['bottom'] && isNaN(diff)) {
        closest = this.settings.breaks['middle'].enabled
        ? this.breaks['middle'] : this.settings.breaks['top'].enabled
        ? this.breaks['top'] : this.breaks['bottom'];
      }
    }

    this.steps = [];
    this.currentBreakpoint = closest;

    this.checkOpacityAttr(this.currentBreakpoint);
    this.checkOverflowAttr(this.currentBreakpoint);

    // Bottom closable
    if (this.settings.bottomClose && closest === this.breaks['bottom']) {
      this.destroy({animate:true});
      return;
    }

    this.doTransition({type: 'end', translateY: closest});
  }

  private swipeNextPoint = (diff, maxDiff, closest) => {
      if (this.currentBreakpoint === this.breaks['top']) {
        if (diff > maxDiff) {
          if (this.settings.breaks['middle'].enabled) { return this.breaks['middle']; }
          if (this.settings.breaks['bottom'].enabled) { 
            if (this.breaks['middle'] < closest) {
              return closest;
            }
            return this.breaks['bottom']; 
          }
        }
        return this.breaks['top'];
      }

      if (this.currentBreakpoint === this.breaks['middle']) {
        if (diff < -maxDiff) {
          if (this.settings.breaks['top'].enabled) { return this.breaks['top']; }
        }
        if (diff > maxDiff) {
          if (this.settings.breaks['bottom'].enabled) { return this.breaks['bottom']; }
        }
        return this.breaks['middle'];
      }

      if (this.currentBreakpoint === this.breaks['bottom']) {
        if (diff < -maxDiff) {
          if (this.settings.breaks['middle'].enabled) { 
            if (this.breaks['middle'] > closest) {
              return closest;
            }
            return this.breaks['middle']; 
          }
          if (this.settings.breaks['top'].enabled) { return this.breaks['top']; }
        }
        return this.breaks['bottom'];
      }

      return closest;
  }

 
  /************************************
   * Events
   */
  private touchEvents = (() => {
    const touch = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
    let desktop = ['mousedown', 'mousemove', 'mouseup'];
    if (Support.pointerEvents) {
      desktop = ['pointerdown', 'pointermove', 'pointerup'];
    }
    const touchEventsTouch = {
      start: touch[0],
      move: touch[1],
      end: touch[2],
      cancel: touch[3],
    };
    const touchEventsDesktop = {
      start: desktop[0],
      move: desktop[1],
      end: desktop[2],
    };
    return Support.touch || !this.settings.simulateTouch ? touchEventsTouch : touchEventsDesktop;
  })();

  private attachEvents(el: Element) {
    // Touch Events
    if (!Support.touch && Support.pointerEvents) {
      el.addEventListener(this.touchEvents.start, this.touchStartCb, false);
      el.addEventListener(this.touchEvents.move, this.touchMoveCb, false);
      el.addEventListener(this.touchEvents.end, this.touchEndCb, false);
    } else {

      if (Support.touch) {
        const passiveListener = this.touchEvents.start === 'touchstart' && Support.passiveListener && this.settings.passiveListeners ? { passive: true, capture: false } : false;
        el.addEventListener(this.touchEvents.start, this.touchStartCb, passiveListener);
        el.addEventListener(this.touchEvents.move, this.touchMoveCb, Support.passiveListener ? { passive: false, capture: false } : false);
        el.addEventListener(this.touchEvents.end, this.touchEndCb, passiveListener);
        if (this.touchEvents['cancel']) {
          el.addEventListener(this.touchEvents['cancel'], this.touchEndCb, passiveListener);
        }
      }

      if ((this.settings.simulateTouch && !this.device.ios && !this.device.android) || (this.settings.simulateTouch && !Support.touch && this.device.ios)) {
        el.addEventListener('mousedown', this.touchStartCb, false);
        el.addEventListener('mousemove', this.touchMoveCb, false);
        el.addEventListener('mouseup', this.touchEndCb, false);
      }
    }
  }

  private detachEvents(el: Element) { 
    // Touch Events
    if (!Support.touch && Support.pointerEvents) {
      el.removeEventListener(this.touchEvents.start, this.touchStartCb, false);
      el.removeEventListener(this.touchEvents.move, this.touchMoveCb, false);
      el.removeEventListener(this.touchEvents.end, this.touchEndCb, false);
    } else {
      if (Support.touch) {
        const passiveListener = this.touchEvents.start === 'onTouchStart' && Support.passiveListener && this.settings.passiveListeners ? { passive: true, capture: false } : false;
        el.removeEventListener(this.touchEvents.start, this.touchStartCb, passiveListener);
        el.removeEventListener(this.touchEvents.move, this.touchMoveCb, false);
        el.removeEventListener(this.touchEvents.end, this.touchEndCb, passiveListener);
        if (this.touchEvents['cancel']) {
          el.removeEventListener(this.touchEvents['cancel'], this.touchEndCb, passiveListener);
        }
      }
      if ((this.settings.simulateTouch && !this.device.ios && !this.device.android) || (this.settings.simulateTouch && !Support.touch && this.device.ios)) {
        el.removeEventListener('mousedown', this.touchStartCb, false);
        el.removeEventListener('mousemove', this.touchMoveCb, false);
        el.removeEventListener('mouseup', this.touchEndCb, false);
      }
    }
  }

  private getPanelTransformY():number {
    const translateYRegex = /\.*translateY\((.*)px\)/i;
    return parseFloat(translateYRegex.exec(this.paneEl.style.transform)[1]);
  }

  /************************************
   * Public user methods
   */

  /**
   * Disable pane drag events
   */
  public disableDrag(): void {
    this.disableDragEvents = true;
  }

  /**
   * Enable pane drag events
   */  
  public enableDrag(): void {
    this.disableDragEvents = false;
  }

  public moveToBreak(val) {
    if (!this.isPanePresented()) {
      console.warn(`Cupertino Pane: Present pane before call moveToBreak()`);
      return null;
    }

    if (!this.settings.breaks[val].enabled) {
      console.warn('Cupertino Pane: %s breakpoint disabled', val);
      return;
    }

    this.checkOpacityAttr(this.breaks[val]);
    this.checkOverflowAttr(this.breaks[val]);
    this.doTransition({type: 'breakpoint', translateY: this.breaks[val]});
    this.currentBreakpoint = this.breaks[val];
  }

  public hide() {
    if (!this.isPanePresented()) {
      console.warn(`Cupertino Pane: Present pane before call hide()`);
      return null;
    }

    if (this.isHidden()) {
      console.warn(`Cupertino Pane: Pane already hidden`);
      return null;
    }

    this.doTransition({type: 'hide', translateY: this.screen_height});
  }

  public isHidden(): (boolean|null) {
    if (!this.isPanePresented()) {
      console.warn(`Cupertino Pane: Present pane before call isHidden()`);
      return null;
    }
    
    return this.paneEl.style.transform === `translateY(${this.screen_height}px) translateZ(0px)`;
  }

  public currentBreak(): (string|null) {
    if (!this.isPanePresented()) {
      console.warn(`Cupertino Pane: Present pane before call currentBreak()`);
      return null;
    }

    if (this.breaks['top'] === this.currentBreakpoint) return 'top';
    if (this.breaks['middle'] === this.currentBreakpoint) return 'middle';
    if (this.breaks['bottom'] === this.currentBreakpoint) return 'bottom';
    return null;
  };

  private destroyResets(): void {
    this.parentEl.appendChild(this.contentEl);
    this.wrapperEl.remove();
    
    /****** Detach Events *******/
    if (!this.settings.dragBy) {
      this.detachEvents(this.paneEl);
    } else {
      this.settings.dragBy.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) this.detachEvents(el);
      });
    }

    // Reset vars
    this.currentBreakpoint = this.breaks[this.settings.initialBreak];

    // Reset styles
    this.contentEl.style.display = 'none';
  }

  public destroy(conf: {animate: boolean} = {animate: false}) {
    if (!this.isPanePresented()) {
      console.warn(`Cupertino Pane: Present pane before call destroy()`);
      return null;
    }

    // Emit event
    this.settings.onWillDismiss();

    /****** Animation & Transition ******/
    if (conf.animate) {
      this.doTransition({type: 'destroy', translateY: this.screen_height}); 
    } else {
      this.destroyResets();
      // Emit event
      this.settings.onDidDismiss();
    }
  }

  /***********************************
   * Transitions handler
   */
  private doTransition(params:any = {}): void {
    // touchmove simple event
    if (params.type === 'move') {
      this.paneEl.style.transition = 'all 0ms linear 0ms';
      this.paneEl.style.transform = `translateY(${params.translateY}px) translateZ(0px)`;
      // Bind for follower same transitions
      if (this.followerEl) {
        this.followerEl.style.transition = 'all 0ms linear 0ms';
        this.followerEl.style.transform = `translateY(${params.translateY - this.breaks[this.settings.initialBreak]}px) translateZ(0px)`;
      }
      
      return;
    }

    // Transition end
    const transitionEnd = () => {
      if (params.type === 'destroy') {
        this.destroyResets();
      }
      this.paneEl.style.transition = `initial`;
      // Bind for follower same transitions
      if (this.followerEl) {
        this.followerEl.style.transition = `initial`;
      }

      // Backdrop 
      if (this.settings.backdrop) {
        if (params.type === 'destroy' || params.type === 'hide') {
          this.backdropEl.style.transition = `initial`;
          this.backdropEl.style.display = `none`;
        }
      } 

      // Emit event
      if (params.type === 'present') {
        this.settings.onDidPresent();  
      }
      if (params.type === 'destroy') {
        this.settings.onDidDismiss();
      }
      this.settings.onTransitionEnd();

      // Remove listener
      this.paneEl.removeEventListener('transitionend', transitionEnd);
    };

    // MoveToBreak, Touchend, Present, Hide, Destroy events
    if (params.type === 'breakpoint' 
        || params.type === 'end' 
        || params.type === 'present'
        || params.type === 'hide'
        || params.type === 'destroy') {

      // backdrop 
      if (this.settings.backdrop) {
        if (this.isHidden()
            || params.type === 'hide'
            || params.type === 'destroy'
            || params.type === 'present') {
          this.backdropEl.style.backgroundColor = 'rgba(0,0,0,.0)';
          this.backdropEl.style.transition = `all ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
          
          if (params.type !== 'hide' && params.type !== 'destroy') {
            this.backdropEl.style.display = 'block';
            setTimeout(() => {
              this.backdropEl.style.backgroundColor = `rgba(0,0,0, ${this.settings.backdropOpacity})`;
            }, 50);
          }
        } 
      }
      
      // freemode
      if (params.type === 'end' && this.settings.freeMode) return; 

      // style
      this.paneEl.style.transition = `transform ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
      // Bind for follower same transitions
      if (this.followerEl) {
        this.followerEl.style.transition = `transform ${this.settings.animationDuration}ms ${this.settings.animationType} 0s`;
      }

      // Main transitions
      if (params.type === 'present') {
        this.paneEl.style.transform = `translateY(${this.screen_height}px) translateZ(0px)`;
        setTimeout(() => {
          // Emit event
          this.settings.onTransitionStart({translateY: {new: this.breaks[this.settings.initialBreak]}});

          this.paneEl.style.transform = `translateY(${this.breaks[this.settings.initialBreak]}px) translateZ(0px)`;
          // Bind for follower same transitions
          if (this.followerEl) {
            this.followerEl.style.transform = `translateY(0px) translateZ(0px)`;
          }          
        }, 50);
      } else {
        // Emit event
        this.settings.onTransitionStart({translateY: {new: params.translateY}});

        this.paneEl.style.transform = `translateY(${params.translateY}px) translateZ(0px)`;
        // Bind for follower same transitions
        if (this.followerEl) {
          this.followerEl.style.transform = `translateY(${params.translateY - this.breaks[this.settings.initialBreak]}px) translateZ(0px)`;
        } 
      }

      this.paneEl.addEventListener('transitionend', transitionEnd);      
      return;
    }
  }

}
