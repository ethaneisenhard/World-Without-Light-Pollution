"use strict";
(() => {
  // ../../packages/library/consent/src/categories.ts
  var CONSENT_CATEGORIES = [
    "strictly_necessary",
    "functional",
    "analytics",
    "marketing",
    "personalization"
  ];
  var OPTIONAL_CONSENT_CATEGORIES = CONSENT_CATEGORIES.filter(
    (c) => c !== "strictly_necessary"
  );

  // ../../packages/library/consent/src/consent-api.ts
  function consentStorageKey(siteId, policyVersion) {
    return `as_consent_v1:${siteId}:${policyVersion}`;
  }
  function defaultConsentMap(regionDefaults = "opt-in") {
    const map = {};
    for (const cat of CONSENT_CATEGORIES) {
      if (cat === "strictly_necessary") {
        map[cat] = true;
        continue;
      }
      if (regionDefaults === "opt-out") {
        map[cat] = cat === "functional" || cat === "analytics";
      } else {
        map[cat] = false;
      }
    }
    return map;
  }
  function resolveConsentStorage(explicit) {
    if (explicit) return explicit;
    try {
      const ls = globalThis.localStorage;
      if (ls && typeof ls.getItem === "function" && typeof ls.setItem === "function") {
        return ls;
      }
    } catch {
    }
    return createMemoryStorage();
  }
  function createConsentApi(opts) {
    const storage = resolveConsentStorage(opts.storage);
    const key = consentStorageKey(opts.siteId, opts.policyVersion);
    let categories = loadOrDefault(storage, key, opts.regionDefaults ?? "opt-in");
    function persist() {
      storage.setItem(key, JSON.stringify(categories));
      opts.onChange?.(categories);
    }
    return {
      get categories() {
        return { ...categories };
      },
      has(category) {
        return Boolean(categories[category]);
      },
      grant(category) {
        if (!CONSENT_CATEGORIES.includes(category)) return;
        if (category === "strictly_necessary") return;
        categories = { ...categories, [category]: true };
        persist();
      },
      revoke(category) {
        if (!CONSENT_CATEGORIES.includes(category)) return;
        if (category === "strictly_necessary") return;
        categories = { ...categories, [category]: false };
        persist();
      },
      acceptAll() {
        const next = { ...categories };
        for (const cat of OPTIONAL_CONSENT_CATEGORIES) next[cat] = true;
        categories = next;
        persist();
      },
      rejectNonEssential() {
        const next = { ...categories };
        for (const cat of OPTIONAL_CONSENT_CATEGORIES) next[cat] = false;
        categories = next;
        persist();
      },
      setMany(selection) {
        const next = { ...categories, ...selection, strictly_necessary: true };
        categories = next;
        persist();
      },
      hasStoredConsent() {
        return storage.getItem(key) !== null;
      },
      storageKey: key
    };
  }
  function loadOrDefault(storage, key, regionDefaults) {
    const raw = storage.getItem(key);
    if (!raw) return defaultConsentMap(regionDefaults);
    try {
      const parsed = JSON.parse(raw);
      return { ...defaultConsentMap(regionDefaults), ...parsed, strictly_necessary: true };
    } catch {
      return defaultConsentMap(regionDefaults);
    }
  }
  function createMemoryStorage() {
    const map = /* @__PURE__ */ new Map();
    return {
      getItem(key) {
        return map.has(key) ? map.get(key) : null;
      },
      setItem(key, value) {
        map.set(key, value);
      }
    };
  }

  // ../../node_modules/.pnpm/xstate@5.32.4/node_modules/xstate/dist/xstate-dev.esm.js
  function getGlobal() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof global !== "undefined") {
      return global;
    }
  }
  function getDevTools() {
    const w = getGlobal();
    if (w.__xstate__) {
      return w.__xstate__;
    }
    return void 0;
  }
  var devToolsAdapter = (service) => {
    if (typeof window === "undefined") {
      return;
    }
    const devTools = getDevTools();
    if (devTools) {
      devTools.register(service);
    }
  };

  // ../../node_modules/.pnpm/xstate@5.32.4/node_modules/xstate/dist/raise-5fb0c8ca.esm.js
  var Mailbox = class {
    constructor(_process) {
      this._process = _process;
      this._active = false;
      this._current = null;
      this._last = null;
    }
    start() {
      this._active = true;
      this.flush();
    }
    clear() {
      if (this._current) {
        this._current.next = null;
        this._last = this._current;
      }
    }
    enqueue(event) {
      const enqueued = {
        value: event,
        next: null
      };
      if (this._current) {
        this._last.next = enqueued;
        this._last = enqueued;
        return;
      }
      this._current = enqueued;
      this._last = enqueued;
      if (this._active) {
        this.flush();
      }
    }
    flush() {
      while (this._current) {
        const consumed = this._current;
        this._process(consumed.value);
        this._current = consumed.next;
      }
      this._last = null;
    }
  };
  var STATE_DELIMITER = ".";
  var TARGETLESS_KEY = "";
  var NULL_EVENT = "";
  var STATE_IDENTIFIER = "#";
  var WILDCARD = "*";
  var XSTATE_INIT = "xstate.init";
  var XSTATE_ERROR = "xstate.error";
  var XSTATE_STOP = "xstate.stop";
  function createAfterEvent(delayRef, id) {
    return {
      type: `xstate.after.${delayRef}.${id}`
    };
  }
  function createDoneStateEvent(id, output) {
    return {
      type: `xstate.done.state.${id}`,
      output
    };
  }
  function createDoneActorEvent(invokeId, output) {
    return {
      type: `xstate.done.actor.${invokeId}`,
      output,
      actorId: invokeId
    };
  }
  function createErrorActorEvent(id, error) {
    return {
      type: `xstate.error.actor.${id}`,
      error,
      actorId: id
    };
  }
  function createInitEvent(input) {
    return {
      type: XSTATE_INIT,
      input
    };
  }
  function reportUnhandledError(err) {
    setTimeout(() => {
      throw err;
    });
  }
  var symbolObservable = (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
  function matchesState(parentStateId, childStateId) {
    const parentStateValue = toStateValue(parentStateId);
    const childStateValue = toStateValue(childStateId);
    if (typeof childStateValue === "string") {
      if (typeof parentStateValue === "string") {
        return childStateValue === parentStateValue;
      }
      return false;
    }
    if (typeof parentStateValue === "string") {
      return parentStateValue in childStateValue;
    }
    return Object.keys(parentStateValue).every((key) => {
      if (!(key in childStateValue)) {
        return false;
      }
      return matchesState(parentStateValue[key], childStateValue[key]);
    });
  }
  function toStatePath(stateId) {
    if (isArray(stateId)) {
      return stateId;
    }
    const result = [];
    let segment = "";
    for (let i = 0; i < stateId.length; i++) {
      const char = stateId.charCodeAt(i);
      switch (char) {
        // \
        case 92:
          segment += stateId[i + 1];
          i++;
          continue;
        // .
        case 46:
          result.push(segment);
          segment = "";
          continue;
      }
      segment += stateId[i];
    }
    result.push(segment);
    return result;
  }
  function toStateValue(stateValue) {
    if (isMachineSnapshot(stateValue)) {
      return stateValue.value;
    }
    if (typeof stateValue !== "string") {
      return stateValue;
    }
    const statePath = toStatePath(stateValue);
    return pathToStateValue(statePath);
  }
  function pathToStateValue(statePath) {
    if (statePath.length === 1) {
      return statePath[0];
    }
    const value = {};
    let marker = value;
    for (let i = 0; i < statePath.length - 1; i++) {
      if (i === statePath.length - 2) {
        marker[statePath[i]] = statePath[i + 1];
      } else {
        const previous = marker;
        marker = {};
        previous[statePath[i]] = marker;
      }
    }
    return value;
  }
  function mapValues(collection, iteratee) {
    const result = {};
    const collectionKeys = Object.keys(collection);
    for (let i = 0; i < collectionKeys.length; i++) {
      const key = collectionKeys[i];
      result[key] = iteratee(collection[key], key, collection, i);
    }
    return result;
  }
  function toArrayStrict(value) {
    if (isArray(value)) {
      return value;
    }
    return [value];
  }
  function toArray(value) {
    if (value === void 0) {
      return [];
    }
    return toArrayStrict(value);
  }
  function resolveOutput(mapper, context, event, self2) {
    if (typeof mapper === "function") {
      return mapper({
        context,
        event,
        self: self2
      });
    }
    return mapper;
  }
  function isArray(value) {
    return Array.isArray(value);
  }
  function isErrorActorEvent(event) {
    return event.type.startsWith("xstate.error.actor");
  }
  function toTransitionConfigArray(configLike) {
    return toArrayStrict(configLike).map((transitionLike) => {
      if (typeof transitionLike === "undefined" || typeof transitionLike === "string") {
        return {
          target: transitionLike
        };
      }
      return transitionLike;
    });
  }
  function normalizeTarget(target) {
    if (target === void 0 || target === TARGETLESS_KEY) {
      return void 0;
    }
    return toArray(target);
  }
  function toObserver(nextHandler, errorHandler, completionHandler) {
    const isObserver = typeof nextHandler === "object";
    const self2 = isObserver ? nextHandler : void 0;
    return {
      next: (isObserver ? nextHandler.next : nextHandler)?.bind(self2),
      error: (isObserver ? nextHandler.error : errorHandler)?.bind(self2),
      complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self2)
    };
  }
  function createInvokeId(stateNodeId, index) {
    return `${index}.${stateNodeId}`;
  }
  function resolveReferencedActor(machine, src) {
    const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
    if (!match) {
      return machine.implementations.actors[src];
    }
    const [, indexStr, nodeId] = match;
    const node = machine.getStateNodeById(nodeId);
    const invokeConfig = node.config.invoke;
    return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
  }
  function matchesEventDescriptor(eventType, descriptor) {
    if (descriptor === eventType) {
      return true;
    }
    if (descriptor === WILDCARD) {
      return true;
    }
    if (!descriptor.endsWith(".*")) {
      return false;
    }
    const partialEventTokens = descriptor.split(".");
    const eventTokens = eventType.split(".");
    for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
      const partialEventToken = partialEventTokens[tokenIndex];
      const eventToken = eventTokens[tokenIndex];
      if (partialEventToken === "*") {
        const isLastToken = tokenIndex === partialEventTokens.length - 1;
        return isLastToken;
      }
      if (partialEventToken !== eventToken) {
        return false;
      }
    }
    return true;
  }
  function createScheduledEventId(actorRef, id) {
    return `${actorRef.sessionId}.${id}`;
  }
  var idCounter = 0;
  function createSystem(rootActor, options) {
    const children = /* @__PURE__ */ new Map();
    const keyedActors = /* @__PURE__ */ new Map();
    const reverseKeyedActors = /* @__PURE__ */ new WeakMap();
    const inspectionObservers = /* @__PURE__ */ new Set();
    const timerMap = {};
    const {
      clock,
      logger
    } = options;
    const scheduler = {
      schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
        const scheduledEvent = {
          source,
          target,
          event,
          delay,
          id,
          startedAt: Date.now()
        };
        const scheduledEventId = createScheduledEventId(source, id);
        system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
        const timeout = clock.setTimeout(() => {
          delete timerMap[scheduledEventId];
          delete system._snapshot._scheduledEvents[scheduledEventId];
          system._relay(source, target, event);
        }, delay);
        timerMap[scheduledEventId] = timeout;
      },
      cancel: (source, id) => {
        const scheduledEventId = createScheduledEventId(source, id);
        const timeout = timerMap[scheduledEventId];
        delete timerMap[scheduledEventId];
        delete system._snapshot._scheduledEvents[scheduledEventId];
        if (timeout !== void 0) {
          clock.clearTimeout(timeout);
        }
      },
      cancelAll: (actorRef) => {
        for (const scheduledEventId in system._snapshot._scheduledEvents) {
          const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
          if (scheduledEvent.source === actorRef) {
            scheduler.cancel(actorRef, scheduledEvent.id);
          }
        }
      }
    };
    const sendInspectionEvent = (event) => {
      if (!inspectionObservers.size) {
        return;
      }
      const resolvedInspectionEvent = {
        ...event,
        rootId: rootActor.sessionId
      };
      inspectionObservers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
    };
    const system = {
      _snapshot: {
        _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {}
      },
      _bookId: () => `x:${idCounter++}`,
      _register: (sessionId, actorRef) => {
        children.set(sessionId, actorRef);
        return sessionId;
      },
      _unregister: (actorRef) => {
        children.delete(actorRef.sessionId);
        const systemId = reverseKeyedActors.get(actorRef);
        if (systemId !== void 0) {
          keyedActors.delete(systemId);
          reverseKeyedActors.delete(actorRef);
        }
      },
      get: (systemId) => {
        return keyedActors.get(systemId);
      },
      getAll: () => {
        return Object.fromEntries(keyedActors.entries());
      },
      _set: (systemId, actorRef) => {
        const existing = keyedActors.get(systemId);
        if (existing && existing !== actorRef) {
          throw new Error(`Actor with system ID '${systemId}' already exists.`);
        }
        keyedActors.set(systemId, actorRef);
        reverseKeyedActors.set(actorRef, systemId);
      },
      inspect: (observerOrFn) => {
        const observer = toObserver(observerOrFn);
        inspectionObservers.add(observer);
        return {
          unsubscribe() {
            inspectionObservers.delete(observer);
          }
        };
      },
      _sendInspectionEvent: sendInspectionEvent,
      _relay: (source, target, event) => {
        system._sendInspectionEvent({
          type: "@xstate.event",
          sourceRef: source,
          actorRef: target,
          event
        });
        target._send(event);
      },
      scheduler,
      getSnapshot: () => {
        return {
          _scheduledEvents: {
            ...system._snapshot._scheduledEvents
          }
        };
      },
      start: () => {
        const scheduledEvents = system._snapshot._scheduledEvents;
        system._snapshot._scheduledEvents = {};
        for (const scheduledId in scheduledEvents) {
          const {
            source,
            target,
            event,
            delay,
            id
          } = scheduledEvents[scheduledId];
          scheduler.schedule(source, target, event, delay, id);
        }
      },
      _clock: clock,
      _logger: logger
    };
    return system;
  }
  var executingCustomAction = false;
  var $$ACTOR_TYPE = 1;
  var ProcessingStatus = /* @__PURE__ */ (function(ProcessingStatus2) {
    ProcessingStatus2[ProcessingStatus2["NotStarted"] = 0] = "NotStarted";
    ProcessingStatus2[ProcessingStatus2["Running"] = 1] = "Running";
    ProcessingStatus2[ProcessingStatus2["Stopped"] = 2] = "Stopped";
    return ProcessingStatus2;
  })({});
  var defaultOptions = {
    clock: {
      setTimeout: (fn, ms) => {
        return setTimeout(fn, ms);
      },
      clearTimeout: (id) => {
        return clearTimeout(id);
      }
    },
    logger: console.log.bind(console),
    devTools: false
  };
  var Actor = class {
    /**
     * Creates a new actor instance for the given logic with the provided options,
     * if any.
     *
     * @param logic The logic to create an actor from
     * @param options Actor options
     */
    constructor(logic, options) {
      this.logic = logic;
      this._snapshot = void 0;
      this.clock = void 0;
      this.options = void 0;
      this.id = void 0;
      this.mailbox = new Mailbox(this._process.bind(this));
      this.observers = /* @__PURE__ */ new Set();
      this.eventListeners = /* @__PURE__ */ new Map();
      this.logger = void 0;
      this._processingStatus = ProcessingStatus.NotStarted;
      this._parent = void 0;
      this._syncSnapshot = void 0;
      this.ref = void 0;
      this._actorScope = void 0;
      this.systemId = void 0;
      this.sessionId = void 0;
      this.system = void 0;
      this._doneEvent = void 0;
      this.src = void 0;
      this._deferred = [];
      const resolvedOptions = {
        ...defaultOptions,
        ...options
      };
      const {
        clock,
        logger,
        parent,
        syncSnapshot,
        id,
        systemId,
        inspect
      } = resolvedOptions;
      this.system = parent ? parent.system : createSystem(this, {
        clock,
        logger
      });
      if (inspect && !parent) {
        this.system.inspect(toObserver(inspect));
      }
      this.sessionId = this.system._bookId();
      this.id = id ?? this.sessionId;
      this.logger = options?.logger ?? this.system._logger;
      this.clock = options?.clock ?? this.system._clock;
      this._parent = parent;
      this._syncSnapshot = syncSnapshot;
      this.options = resolvedOptions;
      this.src = resolvedOptions.src ?? logic;
      this.ref = this;
      this._actorScope = {
        self: this,
        id: this.id,
        sessionId: this.sessionId,
        logger: this.logger,
        defer: (fn) => {
          this._deferred.push(fn);
        },
        system: this.system,
        stopChild: (child) => {
          if (child._parent !== this) {
            throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
          }
          child._stop();
        },
        emit: (emittedEvent) => {
          const listeners = this.eventListeners.get(emittedEvent.type);
          const wildcardListener = this.eventListeners.get("*");
          if (!listeners && !wildcardListener) {
            return;
          }
          const allListeners = [...listeners ? listeners.values() : [], ...wildcardListener ? wildcardListener.values() : []];
          for (const handler of allListeners) {
            try {
              handler(emittedEvent);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
        },
        actionExecutor: (action) => {
          const exec = () => {
            this._actorScope.system._sendInspectionEvent({
              type: "@xstate.action",
              actorRef: this,
              action: {
                type: action.type,
                params: action.params
              }
            });
            if (!action.exec) {
              return;
            }
            const saveExecutingCustomAction = executingCustomAction;
            try {
              executingCustomAction = true;
              action.exec(action.info, action.params);
            } finally {
              executingCustomAction = saveExecutingCustomAction;
            }
          };
          if (this._processingStatus === ProcessingStatus.Running) {
            exec();
          } else {
            this._deferred.push(exec);
          }
        }
      };
      this.send = this.send.bind(this);
      this.system._sendInspectionEvent({
        type: "@xstate.actor",
        actorRef: this
      });
      if (systemId) {
        this.systemId = systemId;
        this.system._set(systemId, this);
      }
      this._initState(options?.snapshot ?? options?.state);
      if (systemId && this._snapshot.status !== "active") {
        this.system._unregister(this);
      }
    }
    _initState(persistedState) {
      try {
        this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
      } catch (err) {
        this._snapshot = {
          status: "error",
          output: void 0,
          error: err
        };
      }
    }
    update(snapshot, event) {
      this._snapshot = snapshot;
      let deferredFn;
      while (deferredFn = this._deferred.shift()) {
        try {
          deferredFn();
        } catch (err) {
          this._deferred.length = 0;
          this._snapshot = {
            ...snapshot,
            status: "error",
            error: err
          };
        }
      }
      switch (this._snapshot.status) {
        case "active":
          for (const observer of this.observers) {
            try {
              observer.next?.(snapshot);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
          break;
        case "done":
          for (const observer of this.observers) {
            try {
              observer.next?.(snapshot);
            } catch (err) {
              reportUnhandledError(err);
            }
          }
          this._stopProcedure();
          this._complete();
          this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
          if (this._parent) {
            this.system._relay(this, this._parent, this._doneEvent);
          }
          break;
        case "error":
          this._error(this._snapshot.error);
          break;
      }
      this.system._sendInspectionEvent({
        type: "@xstate.snapshot",
        actorRef: this,
        event,
        snapshot
      });
    }
    /**
     * Subscribe an observer to an actor’s snapshot values.
     *
     * @remarks
     * The observer will receive the actor’s snapshot value when it is emitted.
     * The observer can be:
     *
     * - A plain function that receives the latest snapshot, or
     * - An observer object whose `.next(snapshot)` method receives the latest
     *   snapshot
     *
     * @example
     *
     * ```ts
     * // Observer as a plain function
     * const subscription = actor.subscribe((snapshot) => {
     *   console.log(snapshot);
     * });
     * ```
     *
     * @example
     *
     * ```ts
     * // Observer as an object
     * const subscription = actor.subscribe({
     *   next(snapshot) {
     *     console.log(snapshot);
     *   },
     *   error(err) {
     *     // ...
     *   },
     *   complete() {
     *     // ...
     *   }
     * });
     * ```
     *
     * The return value of `actor.subscribe(observer)` is a subscription object
     * that has an `.unsubscribe()` method. You can call
     * `subscription.unsubscribe()` to unsubscribe the observer:
     *
     * @example
     *
     * ```ts
     * const subscription = actor.subscribe((snapshot) => {
     *   // ...
     * });
     *
     * // Unsubscribe the observer
     * subscription.unsubscribe();
     * ```
     *
     * When the actor is stopped, all of its observers will automatically be
     * unsubscribed.
     *
     * @param observer - Either a plain function that receives the latest
     *   snapshot, or an observer object whose `.next(snapshot)` method receives
     *   the latest snapshot
     */
    subscribe(nextListenerOrObserver, errorListener, completeListener) {
      const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
      if (this._processingStatus !== ProcessingStatus.Stopped) {
        this.observers.add(observer);
      } else {
        switch (this._snapshot.status) {
          case "done":
            try {
              observer.complete?.();
            } catch (err) {
              reportUnhandledError(err);
            }
            break;
          case "error": {
            const err = this._snapshot.error;
            if (!observer.error) {
              reportUnhandledError(err);
            } else {
              try {
                observer.error(err);
              } catch (err2) {
                reportUnhandledError(err2);
              }
            }
            break;
          }
        }
      }
      return {
        unsubscribe: () => {
          this.observers.delete(observer);
        }
      };
    }
    on(type, handler) {
      let listeners = this.eventListeners.get(type);
      if (!listeners) {
        listeners = /* @__PURE__ */ new Set();
        this.eventListeners.set(type, listeners);
      }
      const wrappedHandler = handler.bind(void 0);
      listeners.add(wrappedHandler);
      return {
        unsubscribe: () => {
          listeners.delete(wrappedHandler);
        }
      };
    }
    select(selector, equalityFn = Object.is) {
      return {
        subscribe: (observerOrFn) => {
          const observer = toObserver(observerOrFn);
          const snapshot = this.getSnapshot();
          let previousSelected = selector(snapshot);
          return this.subscribe((snapshot2) => {
            const nextSelected = selector(snapshot2);
            if (!equalityFn(previousSelected, nextSelected)) {
              previousSelected = nextSelected;
              observer.next?.(nextSelected);
            }
          });
        },
        get: () => selector(this.getSnapshot())
      };
    }
    /** Starts the Actor from the initial state */
    start() {
      if (this._processingStatus === ProcessingStatus.Running) {
        return this;
      }
      if (this._syncSnapshot) {
        this.subscribe({
          next: (snapshot) => {
            if (snapshot.status === "active") {
              this.system._relay(this, this._parent, {
                type: `xstate.snapshot.${this.id}`,
                snapshot
              });
            }
          },
          error: () => {
          }
        });
      }
      this.system._register(this.sessionId, this);
      if (this.systemId) {
        this.system._set(this.systemId, this);
      }
      this._processingStatus = ProcessingStatus.Running;
      const initEvent = createInitEvent(this.options.input);
      this.system._sendInspectionEvent({
        type: "@xstate.event",
        sourceRef: this._parent,
        actorRef: this,
        event: initEvent
      });
      const status = this._snapshot.status;
      switch (status) {
        case "done":
          this.update(this._snapshot, initEvent);
          return this;
        case "error":
          this._error(this._snapshot.error);
          return this;
      }
      if (!this._parent) {
        this.system.start();
      }
      if (this.logic.start) {
        try {
          this.logic.start(this._snapshot, this._actorScope);
        } catch (err) {
          this._snapshot = {
            ...this._snapshot,
            status: "error",
            error: err
          };
          this._error(err);
          return this;
        }
      }
      this.update(this._snapshot, initEvent);
      if (this.options.devTools) {
        this.attachDevTools();
      }
      this.mailbox.start();
      return this;
    }
    _process(event) {
      let nextState;
      let caughtError;
      try {
        nextState = this.logic.transition(this._snapshot, event, this._actorScope);
      } catch (err) {
        caughtError = {
          err
        };
      }
      if (caughtError) {
        const {
          err
        } = caughtError;
        this._snapshot = {
          ...this._snapshot,
          status: "error",
          error: err
        };
        this._error(err);
        return;
      }
      this.update(nextState, event);
      if (event.type === XSTATE_STOP) {
        this._stopProcedure();
        this._complete();
      }
    }
    _stop() {
      if (this._processingStatus === ProcessingStatus.Stopped) {
        return this;
      }
      this.mailbox.clear();
      if (this._processingStatus === ProcessingStatus.NotStarted) {
        this._processingStatus = ProcessingStatus.Stopped;
        return this;
      }
      this.mailbox.enqueue({
        type: XSTATE_STOP
      });
      return this;
    }
    /** Stops the Actor and unsubscribe all listeners. */
    stop() {
      if (this._parent) {
        throw new Error("A non-root actor cannot be stopped directly.");
      }
      return this._stop();
    }
    _complete() {
      for (const observer of this.observers) {
        try {
          observer.complete?.();
        } catch (err) {
          reportUnhandledError(err);
        }
      }
      this.observers.clear();
      this.eventListeners.clear();
    }
    _reportError(err) {
      if (!this.observers.size) {
        if (!this._parent) {
          reportUnhandledError(err);
        }
        this.eventListeners.clear();
        return;
      }
      let reportError = false;
      for (const observer of this.observers) {
        const errorListener = observer.error;
        reportError ||= !errorListener;
        try {
          errorListener?.(err);
        } catch (err2) {
          reportUnhandledError(err2);
        }
      }
      this.observers.clear();
      this.eventListeners.clear();
      if (reportError) {
        reportUnhandledError(err);
      }
    }
    _error(err) {
      this._stopProcedure();
      this._reportError(err);
      if (this._parent) {
        this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
      }
    }
    // TODO: atm children don't belong entirely to the actor so
    // in a way - it's not even super aware of them
    // so we can't stop them from here but we really should!
    // right now, they are being stopped within the machine's transition
    // but that could throw and leave us with "orphaned" active actors
    _stopProcedure() {
      if (this._processingStatus !== ProcessingStatus.Running) {
        return this;
      }
      this.system.scheduler.cancelAll(this);
      this.mailbox.clear();
      this.mailbox = new Mailbox(this._process.bind(this));
      this._processingStatus = ProcessingStatus.Stopped;
      this.system._unregister(this);
      return this;
    }
    /** @internal */
    _send(event) {
      if (this._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      this.mailbox.enqueue(event);
    }
    /**
     * Sends an event to the running Actor to trigger a transition.
     *
     * @param event The event to send
     */
    send(event) {
      this.system._relay(void 0, this, event);
    }
    attachDevTools() {
      const {
        devTools
      } = this.options;
      if (devTools) {
        const resolvedDevToolsAdapter = typeof devTools === "function" ? devTools : devToolsAdapter;
        resolvedDevToolsAdapter(this);
      }
    }
    toJSON() {
      return {
        xstate$$type: $$ACTOR_TYPE,
        id: this.id
      };
    }
    /**
     * Obtain the internal state of the actor, which can be persisted.
     *
     * @remarks
     * The internal state can be persisted from any actor, not only machines.
     *
     * Note that the persisted state is not the same as the snapshot from
     * {@link Actor.getSnapshot}. Persisted state represents the internal state of
     * the actor, while snapshots represent the actor's last emitted value.
     *
     * Can be restored with {@link ActorOptions.state}
     * @see https://stately.ai/docs/persistence
     */
    getPersistedSnapshot(options) {
      return this.logic.getPersistedSnapshot(this._snapshot, options);
    }
    [symbolObservable]() {
      return this;
    }
    /**
     * Read an actor’s snapshot synchronously.
     *
     * @remarks
     * The snapshot represent an actor's last emitted value.
     *
     * When an actor receives an event, its internal state may change. An actor
     * may emit a snapshot when a state transition occurs.
     *
     * Note that some actors, such as callback actors generated with
     * `fromCallback`, will not emit snapshots.
     * @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
     * @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
     */
    getSnapshot() {
      return this._snapshot;
    }
  };
  function createActor(logic, ...[options]) {
    return new Actor(logic, options);
  }
  function resolveCancel(_, snapshot, actionArgs, actionParams, {
    sendId
  }) {
    const resolvedSendId = typeof sendId === "function" ? sendId(actionArgs, actionParams) : sendId;
    return [snapshot, {
      sendId: resolvedSendId
    }, void 0];
  }
  function executeCancel(actorScope, params) {
    actorScope.defer(() => {
      actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
    });
  }
  function cancel(sendId) {
    function cancel2(_args, _params) {
    }
    cancel2.type = "xstate.cancel";
    cancel2.sendId = sendId;
    cancel2.resolve = resolveCancel;
    cancel2.execute = executeCancel;
    return cancel2;
  }
  function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, {
    id,
    systemId,
    src,
    input,
    syncSnapshot
  }) {
    const logic = typeof src === "string" ? resolveReferencedActor(snapshot.machine, src) : src;
    const resolvedId = typeof id === "function" ? id(actionArgs) : id;
    let actorRef;
    let resolvedInput = void 0;
    if (logic) {
      resolvedInput = typeof input === "function" ? input({
        context: snapshot.context,
        event: actionArgs.event,
        self: actorScope.self
      }) : input;
      actorRef = createActor(logic, {
        id: resolvedId,
        src,
        parent: actorScope.self,
        syncSnapshot,
        systemId,
        input: resolvedInput
      });
    }
    return [cloneMachineSnapshot(snapshot, {
      children: {
        ...snapshot.children,
        [resolvedId]: actorRef
      }
    }), {
      id,
      systemId,
      actorRef,
      src,
      input: resolvedInput
    }, void 0];
  }
  function executeSpawn(actorScope, {
    actorRef
  }) {
    if (!actorRef) {
      return;
    }
    actorScope.defer(() => {
      if (actorRef._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      actorRef.start();
    });
  }
  function spawnChild(...[src, {
    id,
    systemId,
    input,
    syncSnapshot = false
  } = {}]) {
    function spawnChild2(_args, _params) {
    }
    spawnChild2.type = "xstate.spawnChild";
    spawnChild2.id = id;
    spawnChild2.systemId = systemId;
    spawnChild2.src = src;
    spawnChild2.input = input;
    spawnChild2.syncSnapshot = syncSnapshot;
    spawnChild2.resolve = resolveSpawn;
    spawnChild2.execute = executeSpawn;
    return spawnChild2;
  }
  function resolveStop(_, snapshot, args, actionParams, {
    actorRef
  }) {
    const actorRefOrString = typeof actorRef === "function" ? actorRef(args, actionParams) : actorRef;
    const resolvedActorRef = typeof actorRefOrString === "string" ? snapshot.children[actorRefOrString] : actorRefOrString;
    let children = snapshot.children;
    if (resolvedActorRef) {
      children = {
        ...children
      };
      delete children[resolvedActorRef.id];
    }
    return [cloneMachineSnapshot(snapshot, {
      children
    }), resolvedActorRef, void 0];
  }
  function unregisterRecursively(actorScope, actorRef) {
    const snapshot = actorRef.getSnapshot();
    if (snapshot && "children" in snapshot) {
      for (const child of Object.values(snapshot.children)) {
        unregisterRecursively(actorScope, child);
      }
    }
    actorScope.system._unregister(actorRef);
  }
  function executeStop(actorScope, actorRef) {
    if (!actorRef) {
      return;
    }
    unregisterRecursively(actorScope, actorRef);
    if (actorRef._processingStatus !== ProcessingStatus.Running) {
      actorScope.stopChild(actorRef);
      return;
    }
    actorScope.defer(() => {
      actorScope.stopChild(actorRef);
    });
  }
  function stopChild(actorRef) {
    function stop2(_args, _params) {
    }
    stop2.type = "xstate.stopChild";
    stop2.actorRef = actorRef;
    stop2.resolve = resolveStop;
    stop2.execute = executeStop;
    return stop2;
  }
  function checkAnd(snapshot, {
    context,
    event
  }, {
    guards
  }) {
    return guards.every((guard) => evaluateGuard(guard, context, event, snapshot));
  }
  function and(guards) {
    function and2(_args, _params) {
      return false;
    }
    and2.check = checkAnd;
    and2.guards = guards;
    return and2;
  }
  function evaluateGuard(guard, context, event, snapshot) {
    const {
      machine
    } = snapshot;
    const isInline = typeof guard === "function";
    const resolved = isInline ? guard : machine.implementations.guards[typeof guard === "string" ? guard : guard.type];
    if (!isInline && !resolved) {
      throw new Error(`Guard '${typeof guard === "string" ? guard : guard.type}' is not implemented.'.`);
    }
    if (typeof resolved !== "function") {
      return evaluateGuard(resolved, context, event, snapshot);
    }
    const guardArgs = {
      context,
      event
    };
    const guardParams = isInline || typeof guard === "string" ? void 0 : "params" in guard ? typeof guard.params === "function" ? guard.params({
      context,
      event
    }) : guard.params : void 0;
    if (!("check" in resolved)) {
      return resolved(guardArgs, guardParams);
    }
    const builtinGuard = resolved;
    return builtinGuard.check(
      snapshot,
      guardArgs,
      resolved
      // this holds all params
    );
  }
  function isAtomicStateNode(stateNode) {
    return stateNode.type === "atomic" || stateNode.type === "final";
  }
  function getChildren(stateNode) {
    return Object.values(stateNode.states).filter((sn) => sn.type !== "history");
  }
  function getProperAncestors(stateNode, toStateNode) {
    const ancestors = [];
    if (toStateNode === stateNode) {
      return ancestors;
    }
    let m = stateNode.parent;
    while (m && m !== toStateNode) {
      ancestors.push(m);
      m = m.parent;
    }
    return ancestors;
  }
  function getAllStateNodes(stateNodes) {
    const nodeSet = new Set(stateNodes);
    const adjList = getAdjList(nodeSet);
    for (const s of nodeSet) {
      if (s.type === "compound" && (!adjList.get(s) || !adjList.get(s).length)) {
        getInitialStateNodesWithTheirAncestors(s).forEach((sn) => nodeSet.add(sn));
      } else {
        if (s.type === "parallel") {
          for (const child of getChildren(s)) {
            if (child.type === "history") {
              continue;
            }
            if (!nodeSet.has(child)) {
              const initialStates = getInitialStateNodesWithTheirAncestors(child);
              for (const initialStateNode of initialStates) {
                nodeSet.add(initialStateNode);
              }
            }
          }
        }
      }
    }
    for (const s of nodeSet) {
      let m = s.parent;
      while (m) {
        nodeSet.add(m);
        m = m.parent;
      }
    }
    return nodeSet;
  }
  function getValueFromAdj(baseNode, adjList) {
    const childStateNodes = adjList.get(baseNode);
    if (!childStateNodes) {
      return {};
    }
    if (baseNode.type === "compound") {
      const childStateNode = childStateNodes[0];
      if (childStateNode) {
        if (isAtomicStateNode(childStateNode)) {
          return childStateNode.key;
        }
      } else {
        return {};
      }
    }
    const stateValue = {};
    for (const childStateNode of childStateNodes) {
      stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
    }
    return stateValue;
  }
  function getAdjList(stateNodes) {
    const adjList = /* @__PURE__ */ new Map();
    for (const s of stateNodes) {
      if (!adjList.has(s)) {
        adjList.set(s, []);
      }
      if (s.parent) {
        if (!adjList.has(s.parent)) {
          adjList.set(s.parent, []);
        }
        adjList.get(s.parent).push(s);
      }
    }
    return adjList;
  }
  function getStateValue(rootNode, stateNodes) {
    const config = getAllStateNodes(stateNodes);
    return getValueFromAdj(rootNode, getAdjList(config));
  }
  function isInFinalState(stateNodeSet, stateNode) {
    if (stateNode.type === "compound") {
      return getChildren(stateNode).some((s) => s.type === "final" && stateNodeSet.has(s));
    }
    if (stateNode.type === "parallel") {
      return getChildren(stateNode).every((sn) => isInFinalState(stateNodeSet, sn));
    }
    return stateNode.type === "final";
  }
  var isStateId = (str) => str[0] === STATE_IDENTIFIER;
  function getCandidates(stateNode, receivedEventType) {
    const exactMatch = stateNode.transitions.get(receivedEventType);
    const wildcardCandidates = [...stateNode.transitions.keys()].filter((eventDescriptor) => eventDescriptor !== receivedEventType && matchesEventDescriptor(receivedEventType, eventDescriptor)).sort((a, b) => b.length - a.length).flatMap((key) => stateNode.transitions.get(key));
    return exactMatch ? [...exactMatch, ...wildcardCandidates] : wildcardCandidates;
  }
  function getDelayedTransitions(stateNode) {
    const afterConfig = stateNode.config.after;
    if (!afterConfig) {
      return [];
    }
    const mutateEntryExit = (delay) => {
      const afterEvent = createAfterEvent(delay, stateNode.id);
      const eventType = afterEvent.type;
      stateNode.entry.push(raise(afterEvent, {
        id: eventType,
        delay
      }));
      stateNode.exit.push(cancel(eventType));
      return eventType;
    };
    const delayedTransitions = Object.keys(afterConfig).flatMap((delay) => {
      const configTransition = afterConfig[delay];
      const resolvedTransition = typeof configTransition === "string" ? {
        target: configTransition
      } : configTransition;
      const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
      const eventType = mutateEntryExit(resolvedDelay);
      return toArray(resolvedTransition).map((transition) => ({
        ...transition,
        event: eventType,
        delay: resolvedDelay
      }));
    });
    return delayedTransitions.map((delayedTransition) => {
      const {
        delay
      } = delayedTransition;
      return {
        ...formatTransition(stateNode, delayedTransition.event, delayedTransition),
        delay
      };
    });
  }
  function formatTransition(stateNode, descriptor, transitionConfig) {
    const normalizedTarget = normalizeTarget(transitionConfig.target);
    const reenter = transitionConfig.reenter ?? false;
    const target = resolveTarget(stateNode, normalizedTarget);
    const transition = {
      ...transitionConfig,
      actions: toArray(transitionConfig.actions),
      guard: transitionConfig.guard,
      target,
      source: stateNode,
      reenter,
      eventType: descriptor,
      toJSON: () => ({
        ...transition,
        source: `#${stateNode.id}`,
        target: target ? target.map((t) => `#${t.id}`) : void 0
      })
    };
    return transition;
  }
  function formatTransitions(stateNode) {
    const transitions = /* @__PURE__ */ new Map();
    if (stateNode.config.on) {
      for (const descriptor of Object.keys(stateNode.config.on)) {
        if (descriptor === NULL_EVENT) {
          throw new Error('Null events ("") cannot be specified as a transition key. Use `always: { ... }` instead.');
        }
        const transitionsConfig = stateNode.config.on[descriptor];
        transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map((t) => formatTransition(stateNode, descriptor, t)));
      }
    }
    if (stateNode.config.onDone) {
      const descriptor = `xstate.done.state.${stateNode.id}`;
      transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
    }
    for (const invokeDef of stateNode.invoke) {
      if (invokeDef.onDone) {
        const descriptor = `xstate.done.actor.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map((t) => formatTransition(stateNode, descriptor, t)));
      }
      if (invokeDef.onError) {
        const descriptor = `xstate.error.actor.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map((t) => formatTransition(stateNode, descriptor, t)));
      }
      if (invokeDef.onSnapshot) {
        const descriptor = `xstate.snapshot.${invokeDef.id}`;
        transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map((t) => formatTransition(stateNode, descriptor, t)));
      }
    }
    for (const delayedTransition of stateNode.after) {
      let existing = transitions.get(delayedTransition.eventType);
      if (!existing) {
        existing = [];
        transitions.set(delayedTransition.eventType, existing);
      }
      existing.push(delayedTransition);
    }
    return transitions;
  }
  function formatRouteTransitions(rootStateNode) {
    const routeTransitions = [];
    const collectRoutes = (states) => {
      Object.values(states).forEach((sn) => {
        if (sn.config.route && sn.config.id) {
          const routeId = sn.config.id;
          const userGuard = sn.config.route.guard;
          const routeMatches = ({
            event
          }) => event.to === `#${routeId}`;
          const transition = {
            ...sn.config.route,
            guard: userGuard ? and([routeMatches, userGuard]) : routeMatches,
            target: `#${routeId}`
          };
          routeTransitions.push(formatTransition(rootStateNode, "xstate.route", transition));
        }
        if (sn.states) {
          collectRoutes(sn.states);
        }
      });
    };
    collectRoutes(rootStateNode.states);
    if (routeTransitions.length > 0) {
      rootStateNode.transitions.set("xstate.route", routeTransitions);
    }
  }
  function formatInitialTransition(stateNode, _target) {
    const resolvedTarget = typeof _target === "string" ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : void 0;
    if (!resolvedTarget && _target) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        `Initial state node "${_target}" not found on parent state node #${stateNode.id}`
      );
    }
    const transition = {
      source: stateNode,
      actions: !_target || typeof _target === "string" ? [] : toArray(_target.actions),
      eventType: null,
      reenter: false,
      target: resolvedTarget ? [resolvedTarget] : [],
      toJSON: () => ({
        ...transition,
        source: `#${stateNode.id}`,
        target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
      })
    };
    return transition;
  }
  function resolveTarget(stateNode, targets) {
    if (targets === void 0) {
      return void 0;
    }
    return targets.map((target) => {
      if (typeof target !== "string") {
        return target;
      }
      if (isStateId(target)) {
        return stateNode.machine.getStateNodeById(target);
      }
      const isInternalTarget = target[0] === STATE_DELIMITER;
      if (isInternalTarget && !stateNode.parent) {
        return getStateNodeByPath(stateNode, target.slice(1));
      }
      const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
      if (stateNode.parent) {
        try {
          const targetStateNode = getStateNodeByPath(stateNode.parent, resolvedTarget);
          return targetStateNode;
        } catch (err) {
          throw new Error(`Invalid transition definition for state node '${stateNode.id}':
${err.message}`);
        }
      } else {
        throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
      }
    });
  }
  function resolveHistoryDefaultTransition(stateNode) {
    const normalizedTarget = normalizeTarget(stateNode.config.target);
    if (!normalizedTarget) {
      if (stateNode.parent.type === "parallel") {
        return {
          target: [stateNode.parent]
        };
      }
      return stateNode.parent.initial;
    }
    return {
      target: normalizedTarget.map((t) => typeof t === "string" ? getStateNodeByPath(stateNode.parent, t) : t)
    };
  }
  function isHistoryNode(stateNode) {
    return stateNode.type === "history";
  }
  function getInitialStateNodesWithTheirAncestors(stateNode) {
    const states = getInitialStateNodes(stateNode);
    for (const initialState of states) {
      for (const ancestor of getProperAncestors(initialState, stateNode)) {
        states.add(ancestor);
      }
    }
    return states;
  }
  function getInitialStateNodes(stateNode) {
    const set = /* @__PURE__ */ new Set();
    function iter(descStateNode) {
      if (set.has(descStateNode)) {
        return;
      }
      set.add(descStateNode);
      if (descStateNode.type === "compound") {
        iter(descStateNode.initial.target[0]);
      } else if (descStateNode.type === "parallel") {
        for (const child of getChildren(descStateNode)) {
          iter(child);
        }
      }
    }
    iter(stateNode);
    return set;
  }
  function getStateNode(stateNode, stateKey) {
    if (isStateId(stateKey)) {
      return stateNode.machine.getStateNodeById(stateKey);
    }
    if (!stateNode.states) {
      throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
    }
    const result = stateNode.states[stateKey];
    if (!result) {
      throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
    }
    return result;
  }
  function getStateNodeByPath(stateNode, statePath) {
    if (typeof statePath === "string" && isStateId(statePath)) {
      try {
        return stateNode.machine.getStateNodeById(statePath);
      } catch {
      }
    }
    const arrayStatePath = toStatePath(statePath).slice();
    let currentStateNode = stateNode;
    while (arrayStatePath.length) {
      const key = arrayStatePath.shift();
      if (!key.length) {
        break;
      }
      currentStateNode = getStateNode(currentStateNode, key);
    }
    return currentStateNode;
  }
  function getStateNodes(stateNode, stateValue) {
    if (typeof stateValue === "string") {
      const childStateNode = stateNode.states[stateValue];
      if (!childStateNode) {
        throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
      }
      return [stateNode, childStateNode];
    }
    const childStateKeys = Object.keys(stateValue);
    const childStateNodes = childStateKeys.map((subStateKey) => getStateNode(stateNode, subStateKey)).filter(Boolean);
    return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
      const subStateNode = getStateNode(stateNode, subStateKey);
      if (!subStateNode) {
        return allSubStateNodes;
      }
      const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
      return allSubStateNodes.concat(subStateNodes);
    }, []));
  }
  function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
    const childStateNode = getStateNode(stateNode, stateValue);
    const next = childStateNode.next(snapshot, event);
    if (!next || !next.length) {
      return stateNode.next(snapshot, event);
    }
    return next;
  }
  function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
    const subStateKeys = Object.keys(stateValue);
    const childStateNode = getStateNode(stateNode, subStateKeys[0]);
    const next = transitionNode(childStateNode, stateValue[subStateKeys[0]], snapshot, event);
    if (!next || !next.length) {
      return stateNode.next(snapshot, event);
    }
    return next;
  }
  function transitionParallelNode(stateNode, stateValue, snapshot, event) {
    const allInnerTransitions = [];
    for (const subStateKey of Object.keys(stateValue)) {
      const subStateValue = stateValue[subStateKey];
      if (!subStateValue) {
        continue;
      }
      const subStateNode = getStateNode(stateNode, subStateKey);
      const innerTransitions = transitionNode(subStateNode, subStateValue, snapshot, event);
      if (innerTransitions) {
        allInnerTransitions.push(...innerTransitions);
      }
    }
    if (!allInnerTransitions.length) {
      return stateNode.next(snapshot, event);
    }
    return allInnerTransitions;
  }
  function transitionNode(stateNode, stateValue, snapshot, event) {
    if (typeof stateValue === "string") {
      return transitionAtomicNode(stateNode, stateValue, snapshot, event);
    }
    if (Object.keys(stateValue).length === 1) {
      return transitionCompoundNode(stateNode, stateValue, snapshot, event);
    }
    return transitionParallelNode(stateNode, stateValue, snapshot, event);
  }
  function getHistoryNodes(stateNode) {
    return Object.keys(stateNode.states).map((key) => stateNode.states[key]).filter((sn) => sn.type === "history");
  }
  function isDescendant(childStateNode, parentStateNode) {
    let marker = childStateNode;
    while (marker.parent && marker.parent !== parentStateNode) {
      marker = marker.parent;
    }
    return marker.parent === parentStateNode;
  }
  function hasIntersection(s1, s2) {
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    for (const item of set1) {
      if (set2.has(item)) {
        return true;
      }
    }
    for (const item of set2) {
      if (set1.has(item)) {
        return true;
      }
    }
    return false;
  }
  function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
    const filteredTransitions = /* @__PURE__ */ new Set();
    for (const t1 of enabledTransitions) {
      let t1Preempted = false;
      const transitionsToRemove = /* @__PURE__ */ new Set();
      for (const t2 of filteredTransitions) {
        if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
          if (isDescendant(t1.source, t2.source)) {
            transitionsToRemove.add(t2);
          } else {
            t1Preempted = true;
            break;
          }
        }
      }
      if (!t1Preempted) {
        for (const t3 of transitionsToRemove) {
          filteredTransitions.delete(t3);
        }
        filteredTransitions.add(t1);
      }
    }
    return Array.from(filteredTransitions);
  }
  function findLeastCommonAncestor(stateNodes) {
    const [head, ...tail] = stateNodes;
    for (const ancestor of getProperAncestors(head, void 0)) {
      if (tail.every((sn) => isDescendant(sn, ancestor))) {
        return ancestor;
      }
    }
  }
  function getEffectiveTargetStates(transition, historyValue) {
    if (!transition.target) {
      return [];
    }
    const targets = /* @__PURE__ */ new Set();
    for (const targetNode of transition.target) {
      if (isHistoryNode(targetNode)) {
        if (historyValue[targetNode.id]) {
          for (const node of historyValue[targetNode.id]) {
            targets.add(node);
          }
        } else {
          for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) {
            targets.add(node);
          }
        }
      } else {
        targets.add(targetNode);
      }
    }
    return [...targets];
  }
  function getTransitionDomain(transition, historyValue) {
    const targetStates = getEffectiveTargetStates(transition, historyValue);
    if (!targetStates) {
      return;
    }
    if (!transition.reenter && targetStates.every((target) => target === transition.source || isDescendant(target, transition.source))) {
      return transition.source;
    }
    const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
    if (lca) {
      return lca;
    }
    if (transition.reenter) {
      return;
    }
    return transition.source.machine.root;
  }
  function computeExitSet(transitions, stateNodeSet, historyValue) {
    const statesToExit = /* @__PURE__ */ new Set();
    for (const t of transitions) {
      if (t.target?.length) {
        const domain = getTransitionDomain(t, historyValue);
        if (t.reenter && t.source === domain) {
          statesToExit.add(domain);
        }
        for (const stateNode of stateNodeSet) {
          if (isDescendant(stateNode, domain)) {
            statesToExit.add(stateNode);
          }
        }
      }
    }
    return [...statesToExit];
  }
  function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
    if (prevStateNodes.length !== nextStateNodeSet.size) {
      return false;
    }
    for (const node of prevStateNodes) {
      if (!nextStateNodeSet.has(node)) {
        return false;
      }
    }
    return true;
  }
  function initialMicrostep(root, preInitialState, actorScope, initEvent, internalQueue) {
    return microstep([{
      target: [...getInitialStateNodes(root)],
      source: root,
      reenter: true,
      actions: [],
      eventType: null,
      toJSON: null
    }], preInitialState, actorScope, initEvent, true, internalQueue);
  }
  function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
    const actions = [];
    if (!transitions.length) {
      return [currentSnapshot, actions];
    }
    const originalExecutor = actorScope.actionExecutor;
    actorScope.actionExecutor = (action) => {
      actions.push(action);
      originalExecutor(action);
    };
    try {
      const mutStateNodeSet = new Set(currentSnapshot._nodes);
      let historyValue = currentSnapshot.historyValue;
      const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
      let nextState = currentSnapshot;
      if (!isInitial) {
        [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue, actorScope.actionExecutor);
      }
      nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap((t) => t.actions), internalQueue, void 0);
      nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
      const nextStateNodes = [...mutStateNodeSet];
      if (nextState.status === "done") {
        nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a, b) => b.order - a.order).flatMap((state) => state.exit), internalQueue, void 0);
      }
      try {
        if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) {
          return [nextState, actions];
        }
        return [cloneMachineSnapshot(nextState, {
          _nodes: nextStateNodes,
          historyValue
        }), actions];
      } catch (e) {
        throw e;
      }
    } finally {
      actorScope.actionExecutor = originalExecutor;
    }
  }
  function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
    if (rootNode.output === void 0) {
      return;
    }
    const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== void 0 && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : void 0);
    return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
  }
  function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
    let nextSnapshot = currentSnapshot;
    const statesToEnter = /* @__PURE__ */ new Set();
    const statesForDefaultEntry = /* @__PURE__ */ new Set();
    computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);
    if (isInitial) {
      statesForDefaultEntry.add(currentSnapshot.machine.root);
    }
    const completedNodes = /* @__PURE__ */ new Set();
    for (const stateNodeToEnter of [...statesToEnter].sort((a, b) => a.order - b.order)) {
      mutStateNodeSet.add(stateNodeToEnter);
      const actions = [];
      actions.push(...stateNodeToEnter.entry);
      for (const invokeDef of stateNodeToEnter.invoke) {
        actions.push(spawnChild(invokeDef.src, {
          ...invokeDef,
          syncSnapshot: !!invokeDef.onSnapshot
        }));
      }
      if (statesForDefaultEntry.has(stateNodeToEnter)) {
        const initialActions = stateNodeToEnter.initial.actions;
        actions.push(...initialActions);
      }
      nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions, internalQueue, stateNodeToEnter.invoke.map((invokeDef) => invokeDef.id));
      if (stateNodeToEnter.type === "final") {
        const parent = stateNodeToEnter.parent;
        let ancestorMarker = parent?.type === "parallel" ? parent : parent?.parent;
        let rootCompletionNode = ancestorMarker || stateNodeToEnter;
        if (parent?.type === "compound") {
          internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== void 0 ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : void 0));
        }
        while (ancestorMarker?.type === "parallel" && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
          completedNodes.add(ancestorMarker);
          internalQueue.push(createDoneStateEvent(ancestorMarker.id));
          rootCompletionNode = ancestorMarker;
          ancestorMarker = ancestorMarker.parent;
        }
        if (ancestorMarker) {
          continue;
        }
        nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
          status: "done",
          output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
        });
      }
    }
    return nextSnapshot;
  }
  function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
    for (const t of transitions) {
      const domain = getTransitionDomain(t, historyValue);
      for (const s of t.target || []) {
        if (!isHistoryNode(s) && // if the target is different than the source then it will *definitely* be entered
        (t.source !== s || // we know that the domain can't lie within the source
        // if it's different than the source then it's outside of it and it means that the target has to be entered as well
        t.source !== domain || // reentering transitions always enter the target, even if it's the source itself
        t.reenter)) {
          statesToEnter.add(s);
          statesForDefaultEntry.add(s);
        }
        addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
      }
      const targetStates = getEffectiveTargetStates(t, historyValue);
      for (const s of targetStates) {
        const ancestors = getProperAncestors(s, domain);
        if (domain?.type === "parallel") {
          ancestors.push(domain);
        }
        addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t.source.parent && t.reenter ? void 0 : domain);
      }
    }
  }
  function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
    if (isHistoryNode(stateNode)) {
      if (historyValue[stateNode.id]) {
        const historyStateNodes = historyValue[stateNode.id];
        for (const s of historyStateNodes) {
          statesToEnter.add(s);
          addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
        }
        for (const s of historyStateNodes) {
          addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
        }
      } else {
        const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
        for (const s of historyDefaultTransition.target) {
          statesToEnter.add(s);
          if (historyDefaultTransition === stateNode.parent?.initial) {
            statesForDefaultEntry.add(stateNode.parent);
          }
          addDescendantStatesToEnter(s, historyValue, statesForDefaultEntry, statesToEnter);
        }
        for (const s of historyDefaultTransition.target) {
          addProperAncestorStatesToEnter(s, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
        }
      }
    } else {
      if (stateNode.type === "compound") {
        const [initialState] = stateNode.initial.target;
        if (!isHistoryNode(initialState)) {
          statesToEnter.add(initialState);
          statesForDefaultEntry.add(initialState);
        }
        addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
        addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
      } else {
        if (stateNode.type === "parallel") {
          for (const child of getChildren(stateNode).filter((sn) => !isHistoryNode(sn))) {
            if (![...statesToEnter].some((s) => isDescendant(s, child))) {
              if (!isHistoryNode(child)) {
                statesToEnter.add(child);
                statesForDefaultEntry.add(child);
              }
              addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
            }
          }
        }
      }
    }
  }
  function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
    for (const anc of ancestors) {
      if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) {
        statesToEnter.add(anc);
      }
      if (anc.type === "parallel") {
        for (const child of getChildren(anc).filter((sn) => !isHistoryNode(sn))) {
          if (![...statesToEnter].some((s) => isDescendant(s, child))) {
            statesToEnter.add(child);
            addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
          }
        }
      }
    }
  }
  function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
    addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
  }
  function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
    let nextSnapshot = currentSnapshot;
    const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
    statesToExit.sort((a, b) => b.order - a.order);
    let changedHistory;
    for (const exitStateNode of statesToExit) {
      for (const historyNode of getHistoryNodes(exitStateNode)) {
        let predicate;
        if (historyNode.history === "deep") {
          predicate = (sn) => isAtomicStateNode(sn) && isDescendant(sn, exitStateNode);
        } else {
          predicate = (sn) => {
            return sn.parent === exitStateNode;
          };
        }
        changedHistory ??= {
          ...historyValue
        };
        changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
      }
    }
    for (const s of statesToExit) {
      nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s.exit, ...s.invoke.map((def) => stopChild(def.id))], internalQueue, void 0);
      mutStateNodeSet.delete(s);
    }
    return [nextSnapshot, changedHistory || historyValue];
  }
  function getAction(machine, actionType) {
    return machine.implementations.actions[actionType];
  }
  function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, extra, retries) {
    const {
      machine
    } = currentSnapshot;
    let intermediateSnapshot = currentSnapshot;
    for (const action of actions) {
      const isInline = typeof action === "function";
      const resolvedAction = isInline ? action : (
        // the existing type of `.actions` assumes non-nullable `TExpressionAction`
        // it's fine to cast this here to get a common type and lack of errors in the rest of the code
        // our logic below makes sure that we call those 2 "variants" correctly
        getAction(machine, typeof action === "string" ? action : action.type)
      );
      const actionArgs = {
        context: intermediateSnapshot.context,
        event,
        self: actorScope.self,
        system: actorScope.system
      };
      const actionParams = isInline || typeof action === "string" ? void 0 : "params" in action ? typeof action.params === "function" ? action.params({
        context: intermediateSnapshot.context,
        event
      }) : action.params : void 0;
      if (!resolvedAction || !("resolve" in resolvedAction)) {
        actorScope.actionExecutor({
          type: typeof action === "string" ? action : typeof action === "object" ? action.type : action.name || "(anonymous)",
          info: actionArgs,
          params: actionParams,
          exec: resolvedAction
        });
        continue;
      }
      const builtinAction = resolvedAction;
      const [nextState, params, actions2] = builtinAction.resolve(
        actorScope,
        intermediateSnapshot,
        actionArgs,
        actionParams,
        resolvedAction,
        // this holds all params
        extra
      );
      intermediateSnapshot = nextState;
      if ("retryResolve" in builtinAction) {
        retries?.push([builtinAction, params]);
      }
      if ("execute" in builtinAction) {
        actorScope.actionExecutor({
          type: builtinAction.type,
          info: actionArgs,
          params,
          exec: builtinAction.execute.bind(null, actorScope, params)
        });
      }
      if (actions2) {
        intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions2, extra, retries);
      }
    }
    return intermediateSnapshot;
  }
  function resolveActionsAndContext(currentSnapshot, event, actorScope, actions, internalQueue, deferredActorIds) {
    const retries = deferredActorIds ? [] : void 0;
    const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, {
      internalQueue,
      deferredActorIds
    }, retries);
    retries?.forEach(([builtinAction, params]) => {
      builtinAction.retryResolve(actorScope, nextState, params);
    });
    return nextState;
  }
  function macrostep(snapshot, event, actorScope, internalQueue) {
    let nextSnapshot = snapshot;
    const microsteps = [];
    function addMicrostep(step, event2, transitions) {
      actorScope.system._sendInspectionEvent({
        type: "@xstate.microstep",
        actorRef: actorScope.self,
        event: event2,
        snapshot: step[0],
        _transitions: transitions
      });
      microsteps.push(step);
    }
    if (event.type === XSTATE_STOP) {
      nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), {
        status: "stopped"
      });
      addMicrostep([nextSnapshot, []], event, []);
      return {
        snapshot: nextSnapshot,
        microsteps
      };
    }
    let nextEvent = event;
    if (nextEvent.type !== XSTATE_INIT) {
      const currentEvent = nextEvent;
      const isErr = isErrorActorEvent(currentEvent);
      const transitions = selectTransitions(currentEvent, nextSnapshot);
      if (isErr && !transitions.length) {
        nextSnapshot = cloneMachineSnapshot(snapshot, {
          status: "error",
          error: currentEvent.error
        });
        addMicrostep([nextSnapshot, []], currentEvent, []);
        return {
          snapshot: nextSnapshot,
          microsteps
        };
      }
      const step = microstep(
        transitions,
        snapshot,
        actorScope,
        nextEvent,
        false,
        // isInitial
        internalQueue
      );
      nextSnapshot = step[0];
      addMicrostep(step, currentEvent, transitions);
    }
    let shouldSelectEventlessTransitions = true;
    const maxIterations = snapshot.machine.options?.maxIterations ?? Infinity;
    let iterationCount = 0;
    while (nextSnapshot.status === "active") {
      iterationCount++;
      if (iterationCount > maxIterations) {
        throw new Error(`Infinite loop detected: the machine has processed more than ${maxIterations} microsteps without reaching a stable state. This usually happens when there's a cycle of transitions (e.g., eventless transitions or raised events causing state A -> B -> C -> A).`);
      }
      let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];
      const previousState = enabledTransitions.length ? nextSnapshot : void 0;
      if (!enabledTransitions.length) {
        if (!internalQueue.length) {
          break;
        }
        nextEvent = internalQueue.shift();
        enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
      }
      const step = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
      nextSnapshot = step[0];
      shouldSelectEventlessTransitions = nextSnapshot !== previousState;
      addMicrostep(step, nextEvent, enabledTransitions);
    }
    if (nextSnapshot.status !== "active") {
      stopChildren(nextSnapshot, nextEvent, actorScope);
    }
    return {
      snapshot: nextSnapshot,
      microsteps
    };
  }
  function stopChildren(nextState, event, actorScope) {
    return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map((child) => stopChild(child)), [], void 0);
  }
  function selectTransitions(event, nextState) {
    return nextState.machine.getTransitionData(nextState, event);
  }
  function selectEventlessTransitions(nextState, event) {
    const enabledTransitionSet = /* @__PURE__ */ new Set();
    const atomicStates = nextState._nodes.filter(isAtomicStateNode);
    for (const stateNode of atomicStates) {
      loop: for (const s of [stateNode].concat(getProperAncestors(stateNode, void 0))) {
        if (!s.always) {
          continue;
        }
        for (const transition of s.always) {
          if (transition.guard === void 0 || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
            enabledTransitionSet.add(transition);
            break loop;
          }
        }
      }
    }
    return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
  }
  function resolveStateValue(rootNode, stateValue) {
    const allStateNodes = getAllStateNodes(getStateNodes(rootNode, stateValue));
    return getStateValue(rootNode, [...allStateNodes]);
  }
  function isMachineSnapshot(value) {
    return !!value && typeof value === "object" && "machine" in value && "value" in value;
  }
  var machineSnapshotMatches = function matches(testValue) {
    return matchesState(testValue, this.value);
  };
  var machineSnapshotHasTag = function hasTag(tag) {
    return this.tags.has(tag);
  };
  var machineSnapshotCan = function can(event) {
    const transitionData = this.machine.getTransitionData(this, event);
    return !!transitionData?.length && // Check that at least one transition is not forbidden
    transitionData.some((t) => t.target !== void 0 || t.actions.length);
  };
  var machineSnapshotToJSON = function toJSON() {
    const {
      _nodes: nodes,
      tags,
      machine,
      getMeta: getMeta2,
      toJSON: toJSON2,
      can: can2,
      hasTag: hasTag2,
      matches: matches2,
      ...jsonValues
    } = this;
    return {
      ...jsonValues,
      tags: Array.from(tags)
    };
  };
  var machineSnapshotGetMeta = function getMeta() {
    return this._nodes.reduce((acc, stateNode) => {
      if (stateNode.meta !== void 0) {
        acc[stateNode.id] = stateNode.meta;
      }
      return acc;
    }, {});
  };
  function createMachineSnapshot(config, machine) {
    return {
      status: config.status,
      output: config.output,
      error: config.error,
      machine,
      context: config.context,
      _nodes: config._nodes,
      value: getStateValue(machine.root, config._nodes),
      tags: new Set(config._nodes.flatMap((sn) => sn.tags)),
      children: config.children,
      historyValue: config.historyValue || {},
      matches: machineSnapshotMatches,
      hasTag: machineSnapshotHasTag,
      can: machineSnapshotCan,
      getMeta: machineSnapshotGetMeta,
      toJSON: machineSnapshotToJSON
    };
  }
  function cloneMachineSnapshot(snapshot, config = {}) {
    return createMachineSnapshot({
      ...snapshot,
      ...config
    }, snapshot.machine);
  }
  function serializeHistoryValue(historyValue) {
    if (typeof historyValue !== "object" || historyValue === null) {
      return {};
    }
    const result = {};
    for (const key in historyValue) {
      const value = historyValue[key];
      if (Array.isArray(value)) {
        result[key] = value.map((item) => ({
          id: item.id
        }));
      }
    }
    return result;
  }
  function getPersistedSnapshot(snapshot, options) {
    const {
      _nodes: nodes,
      tags,
      machine,
      children,
      context,
      can: can2,
      hasTag: hasTag2,
      matches: matches2,
      getMeta: getMeta2,
      toJSON: toJSON2,
      ...jsonValues
    } = snapshot;
    const childrenJson = {};
    for (const id in children) {
      const child = children[id];
      childrenJson[id] = {
        snapshot: child.getPersistedSnapshot(options),
        src: child.src,
        systemId: child.systemId,
        syncSnapshot: child._syncSnapshot
      };
    }
    const persisted = {
      ...jsonValues,
      context: persistContext(context),
      children: childrenJson,
      historyValue: serializeHistoryValue(jsonValues.historyValue)
    };
    return persisted;
  }
  function persistContext(contextPart) {
    let copy;
    for (const key in contextPart) {
      const value = contextPart[key];
      if (value && typeof value === "object") {
        if ("sessionId" in value && "send" in value && "ref" in value) {
          copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
            ...contextPart
          };
          copy[key] = {
            xstate$$type: $$ACTOR_TYPE,
            id: value.id
          };
        } else {
          const result = persistContext(value);
          if (result !== value) {
            copy ??= Array.isArray(contextPart) ? contextPart.slice() : {
              ...contextPart
            };
            copy[key] = result;
          }
        }
      }
    }
    return copy ?? contextPart;
  }
  function resolveRaise(_, snapshot, args, actionParams, {
    event: eventOrExpr,
    id,
    delay
  }, {
    internalQueue
  }) {
    const delaysMap = snapshot.machine.implementations.delays;
    if (typeof eventOrExpr === "string") {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`
      );
    }
    const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
    let resolvedDelay;
    if (typeof delay === "string") {
      const configDelay = delaysMap && delaysMap[delay];
      resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
    } else {
      resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
    }
    if (typeof resolvedDelay !== "number") {
      internalQueue.push(resolvedEvent);
    }
    return [snapshot, {
      event: resolvedEvent,
      id,
      delay: resolvedDelay
    }, void 0];
  }
  function executeRaise(actorScope, params) {
    const {
      event,
      delay,
      id
    } = params;
    if (typeof delay === "number") {
      actorScope.defer(() => {
        const self2 = actorScope.self;
        actorScope.system.scheduler.schedule(self2, self2, event, delay, id);
      });
      return;
    }
  }
  function raise(eventOrExpr, options) {
    function raise2(_args, _params) {
    }
    raise2.type = "xstate.raise";
    raise2.event = eventOrExpr;
    raise2.id = options?.id;
    raise2.delay = options?.delay;
    raise2.resolve = resolveRaise;
    raise2.execute = executeRaise;
    return raise2;
  }

  // ../../node_modules/.pnpm/xstate@5.32.4/node_modules/xstate/dist/assign-29f23f4d.esm.js
  function createSpawner(actorScope, {
    machine,
    context
  }, event, spawnedChildren) {
    const spawn = (src, options) => {
      if (typeof src === "string") {
        const logic = resolveReferencedActor(machine, src);
        if (!logic) {
          throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
        }
        const actorRef = createActor(logic, {
          id: options?.id,
          parent: actorScope.self,
          syncSnapshot: options?.syncSnapshot,
          input: typeof options?.input === "function" ? options.input({
            context,
            event,
            self: actorScope.self
          }) : options?.input,
          src,
          systemId: options?.systemId
        });
        spawnedChildren[actorRef.id] = actorRef;
        return actorRef;
      } else {
        const actorRef = createActor(src, {
          id: options?.id,
          parent: actorScope.self,
          syncSnapshot: options?.syncSnapshot,
          input: options?.input,
          src,
          systemId: options?.systemId
        });
        return actorRef;
      }
    };
    return (src, options) => {
      const actorRef = spawn(src, options);
      spawnedChildren[actorRef.id] = actorRef;
      actorScope.defer(() => {
        if (actorRef._processingStatus === ProcessingStatus.Stopped) {
          return;
        }
        actorRef.start();
      });
      return actorRef;
    };
  }
  function resolveAssign(actorScope, snapshot, actionArgs, actionParams, {
    assignment
  }) {
    if (!snapshot.context) {
      throw new Error("Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.");
    }
    const spawnedChildren = {};
    const assignArgs = {
      context: snapshot.context,
      event: actionArgs.event,
      spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
      self: actorScope.self,
      system: actorScope.system
    };
    let partialUpdate = {};
    if (typeof assignment === "function") {
      partialUpdate = assignment(assignArgs, actionParams);
    } else {
      for (const key of Object.keys(assignment)) {
        const propAssignment = assignment[key];
        partialUpdate[key] = typeof propAssignment === "function" ? propAssignment(assignArgs, actionParams) : propAssignment;
      }
    }
    const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
    return [cloneMachineSnapshot(snapshot, {
      context: updatedContext,
      children: Object.keys(spawnedChildren).length ? {
        ...snapshot.children,
        ...spawnedChildren
      } : snapshot.children
    }), void 0, void 0];
  }
  function assign(assignment) {
    function assign2(_args, _params) {
    }
    assign2.type = "xstate.assign";
    assign2.assignment = assignment;
    assign2.resolve = resolveAssign;
    return assign2;
  }

  // ../../node_modules/.pnpm/xstate@5.32.4/node_modules/xstate/dist/StateMachine-5f345bba.esm.js
  var cache = /* @__PURE__ */ new WeakMap();
  function memo(object, key, fn) {
    let memoizedData = cache.get(object);
    if (!memoizedData) {
      memoizedData = {
        [key]: fn()
      };
      cache.set(object, memoizedData);
    } else if (!(key in memoizedData)) {
      memoizedData[key] = fn();
    }
    return memoizedData[key];
  }
  var EMPTY_OBJECT = {};
  var toSerializableAction = (action) => {
    if (typeof action === "string") {
      return {
        type: action
      };
    }
    if (typeof action === "function") {
      if ("resolve" in action) {
        return {
          type: action.type
        };
      }
      return {
        type: action.name
      };
    }
    return action;
  };
  var StateNode = class _StateNode {
    constructor(config, options) {
      this.config = config;
      this.key = void 0;
      this.id = void 0;
      this.type = void 0;
      this.path = void 0;
      this.states = void 0;
      this.history = void 0;
      this.entry = void 0;
      this.exit = void 0;
      this.parent = void 0;
      this.machine = void 0;
      this.meta = void 0;
      this.output = void 0;
      this.order = -1;
      this.description = void 0;
      this.tags = [];
      this.transitions = void 0;
      this.always = void 0;
      this.parent = options._parent;
      this.key = options._key;
      this.machine = options._machine;
      this.path = this.parent ? this.parent.path.concat(this.key) : [];
      this.id = this.config.id || [this.machine.id, ...this.path].join(STATE_DELIMITER);
      this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? "compound" : this.config.history ? "history" : "atomic");
      this.description = this.config.description;
      this.order = this.machine.idMap.size;
      this.machine.idMap.set(this.id, this);
      this.states = this.config.states ? mapValues(this.config.states, (stateConfig, key) => {
        const stateNode = new _StateNode(stateConfig, {
          _parent: this,
          _key: key,
          _machine: this.machine
        });
        return stateNode;
      }) : EMPTY_OBJECT;
      if (this.type === "compound" && !this.config.initial) {
        throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
      }
      this.history = this.config.history === true ? "shallow" : this.config.history || false;
      this.entry = toArray(this.config.entry).slice();
      this.exit = toArray(this.config.exit).slice();
      this.meta = this.config.meta;
      this.output = this.type === "final" || !this.parent ? this.config.output : void 0;
      this.tags = toArray(config.tags).slice();
    }
    /** @internal */
    _initialize() {
      this.transitions = formatTransitions(this);
      if (this.config.always) {
        this.always = toTransitionConfigArray(this.config.always).map((t) => formatTransition(this, NULL_EVENT, t));
      }
      Object.keys(this.states).forEach((key) => {
        this.states[key]._initialize();
      });
    }
    /** The well-structured state node definition. */
    get definition() {
      return {
        id: this.id,
        key: this.key,
        version: this.machine.version,
        type: this.type,
        initial: this.initial ? {
          target: this.initial.target,
          source: this,
          actions: this.initial.actions.map(toSerializableAction),
          eventType: null,
          reenter: false,
          toJSON: () => ({
            target: this.initial.target.map((t) => `#${t.id}`),
            source: `#${this.id}`,
            actions: this.initial.actions.map(toSerializableAction),
            eventType: null
          })
        } : void 0,
        history: this.history,
        states: mapValues(this.states, (state) => {
          return state.definition;
        }),
        on: this.on,
        transitions: [...this.transitions.values()].flat().map((t) => ({
          ...t,
          actions: t.actions.map(toSerializableAction)
        })),
        entry: this.entry.map(toSerializableAction),
        exit: this.exit.map(toSerializableAction),
        meta: this.meta,
        order: this.order || -1,
        output: this.output,
        invoke: this.invoke,
        description: this.description,
        tags: this.tags
      };
    }
    /** @internal */
    toJSON() {
      return this.definition;
    }
    /** The logic invoked as actors by this state node. */
    get invoke() {
      return memo(this, "invoke", () => toArray(this.config.invoke).map((invokeConfig, i) => {
        const {
          src,
          systemId
        } = invokeConfig;
        const resolvedId = invokeConfig.id ?? createInvokeId(this.id, i);
        const sourceName = typeof src === "string" ? src : `xstate.invoke.${createInvokeId(this.id, i)}`;
        return {
          ...invokeConfig,
          src: sourceName,
          id: resolvedId,
          systemId,
          toJSON() {
            const {
              onDone,
              onError,
              ...invokeDefValues
            } = invokeConfig;
            return {
              ...invokeDefValues,
              type: "xstate.invoke",
              src: sourceName,
              id: resolvedId
            };
          }
        };
      }));
    }
    /** The mapping of events to transitions. */
    get on() {
      return memo(this, "on", () => {
        const transitions = this.transitions;
        return [...transitions].flatMap(([descriptor, t]) => t.map((t2) => [descriptor, t2])).reduce((map, [descriptor, transition]) => {
          map[descriptor] = map[descriptor] || [];
          map[descriptor].push(transition);
          return map;
        }, {});
      });
    }
    get after() {
      return memo(this, "delayedTransitions", () => getDelayedTransitions(this));
    }
    get initial() {
      return memo(this, "initial", () => formatInitialTransition(this, this.config.initial));
    }
    /** @internal */
    next(snapshot, event) {
      const eventType = event.type;
      const actions = [];
      let selectedTransition;
      const candidates = memo(this, `candidates-${eventType}`, () => getCandidates(this, eventType));
      for (const candidate of candidates) {
        const {
          guard
        } = candidate;
        const resolvedContext = snapshot.context;
        let guardPassed = false;
        try {
          guardPassed = !guard || evaluateGuard(guard, resolvedContext, event, snapshot);
        } catch (err) {
          const guardType = typeof guard === "string" ? guard : typeof guard === "object" ? guard.type : void 0;
          throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ""}in transition for event '${eventType}' in state node '${this.id}':
${err.message}`);
        }
        if (guardPassed) {
          actions.push(...candidate.actions);
          selectedTransition = candidate;
          break;
        }
      }
      return selectedTransition ? [selectedTransition] : void 0;
    }
    /** All the event types accepted by this state node and its descendants. */
    get events() {
      return memo(this, "events", () => {
        const {
          states
        } = this;
        const events = new Set(this.ownEvents);
        if (states) {
          for (const stateId of Object.keys(states)) {
            const state = states[stateId];
            if (state.states) {
              for (const event of state.events) {
                events.add(`${event}`);
              }
            }
          }
        }
        return Array.from(events);
      });
    }
    /**
     * All the events that have transitions directly from this state node.
     *
     * Excludes any inert events.
     */
    get ownEvents() {
      const keys = Object.keys(Object.fromEntries(this.transitions));
      const events = new Set(keys.filter((descriptor) => {
        return this.transitions.get(descriptor).some((transition) => !(!transition.target && !transition.actions.length && !transition.reenter));
      }));
      return Array.from(events);
    }
  };
  var STATE_IDENTIFIER2 = "#";
  var StateMachine = class _StateMachine {
    constructor(config, implementations) {
      this.config = config;
      this.version = void 0;
      this.schemas = void 0;
      this.implementations = void 0;
      this.options = void 0;
      this.__xstatenode = true;
      this.idMap = /* @__PURE__ */ new Map();
      this.root = void 0;
      this.id = void 0;
      this.states = void 0;
      this.events = void 0;
      this.id = config.id || "(machine)";
      this.implementations = {
        actors: implementations?.actors ?? {},
        actions: implementations?.actions ?? {},
        delays: implementations?.delays ?? {},
        guards: implementations?.guards ?? {}
      };
      this.version = this.config.version;
      this.schemas = this.config.schemas;
      this.options = {
        maxIterations: Infinity,
        ...this.config.options
      };
      this.transition = this.transition.bind(this);
      this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
      this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
      this.restoreSnapshot = this.restoreSnapshot.bind(this);
      this.start = this.start.bind(this);
      this.root = new StateNode(config, {
        _key: this.id,
        _machine: this
      });
      this.root._initialize();
      formatRouteTransitions(this.root);
      this.states = this.root.states;
      this.events = this.root.events;
    }
    /**
     * Clones this state machine with the provided implementations.
     *
     * @param implementations Options (`actions`, `guards`, `actors`, `delays`) to
     *   recursively merge with the existing options.
     * @returns A new `StateMachine` instance with the provided implementations.
     */
    provide(implementations) {
      const {
        actions,
        guards,
        actors,
        delays
      } = this.implementations;
      return new _StateMachine(this.config, {
        actions: {
          ...actions,
          ...implementations.actions
        },
        guards: {
          ...guards,
          ...implementations.guards
        },
        actors: {
          ...actors,
          ...implementations.actors
        },
        delays: {
          ...delays,
          ...implementations.delays
        }
      });
    }
    resolveState(config) {
      const resolvedStateValue = resolveStateValue(this.root, config.value);
      const nodeSet = getAllStateNodes(getStateNodes(this.root, resolvedStateValue));
      return createMachineSnapshot({
        _nodes: [...nodeSet],
        context: config.context || {},
        children: {},
        status: isInFinalState(nodeSet, this.root) ? "done" : config.status || "active",
        output: config.output,
        error: config.error,
        historyValue: config.historyValue
      }, this);
    }
    /**
     * Determines the next snapshot given the current `snapshot` and received
     * `event`. Calculates a full macrostep from all microsteps.
     *
     * @param snapshot The current snapshot
     * @param event The received event
     */
    transition(snapshot, event, actorScope) {
      return macrostep(snapshot, event, actorScope, []).snapshot;
    }
    /**
     * Determines the next state given the current `state` and `event`. Calculates
     * a microstep.
     *
     * @param state The current state
     * @param event The received event
     */
    microstep(snapshot, event, actorScope) {
      return macrostep(snapshot, event, actorScope, []).microsteps.map(([s]) => s);
    }
    getTransitionData(snapshot, event) {
      return transitionNode(this.root, snapshot.value, snapshot, event) || [];
    }
    /**
     * The initial state _before_ evaluating any microsteps. This "pre-initial"
     * state is provided to initial actions executed in the initial state.
     *
     * @internal
     */
    _getPreInitialState(actorScope, initEvent, internalQueue) {
      const {
        context
      } = this.config;
      const preInitial = createMachineSnapshot({
        context: typeof context !== "function" && context ? context : {},
        _nodes: [this.root],
        children: {},
        status: "active"
      }, this);
      if (typeof context === "function") {
        const assignment = ({
          spawn,
          event,
          self: self2
        }) => context({
          spawn,
          input: event.input,
          self: self2
        });
        return resolveActionsAndContext(preInitial, initEvent, actorScope, [assign(assignment)], internalQueue, void 0);
      }
      return preInitial;
    }
    /**
     * Returns the initial `State` instance, with reference to `self` as an
     * `ActorRef`.
     */
    getInitialSnapshot(actorScope, input) {
      const initEvent = createInitEvent(input);
      const internalQueue = [];
      const preInitialState = this._getPreInitialState(actorScope, initEvent, internalQueue);
      const [nextState] = initialMicrostep(this.root, preInitialState, actorScope, initEvent, internalQueue);
      const {
        snapshot: macroState
      } = macrostep(nextState, initEvent, actorScope, internalQueue);
      return macroState;
    }
    start(snapshot) {
      Object.values(snapshot.children).forEach((child) => {
        if (child.getSnapshot().status === "active") {
          child.start();
        }
      });
    }
    getStateNodeById(stateId) {
      const fullPath = toStatePath(stateId);
      const relativePath = fullPath.slice(1);
      const resolvedStateId = isStateId(fullPath[0]) ? fullPath[0].slice(STATE_IDENTIFIER2.length) : fullPath[0];
      const stateNode = this.idMap.get(resolvedStateId);
      if (!stateNode) {
        throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
      }
      return getStateNodeByPath(stateNode, relativePath);
    }
    get definition() {
      return this.root.definition;
    }
    toJSON() {
      return this.definition;
    }
    getPersistedSnapshot(snapshot, options) {
      return getPersistedSnapshot(snapshot, options);
    }
    restoreSnapshot(snapshot, _actorScope) {
      const children = {};
      const snapshotChildren = snapshot.children;
      Object.keys(snapshotChildren).forEach((actorId) => {
        const actorData = snapshotChildren[actorId];
        const childState = actorData.snapshot;
        const src = actorData.src;
        const logic = typeof src === "string" ? resolveReferencedActor(this, src) : src;
        if (!logic) {
          return;
        }
        const actorRef = createActor(logic, {
          id: actorId,
          parent: _actorScope.self,
          syncSnapshot: actorData.syncSnapshot,
          snapshot: childState,
          src,
          systemId: actorData.systemId
        });
        children[actorId] = actorRef;
      });
      function resolveHistoryReferencedState(root, referenced) {
        if (referenced instanceof StateNode) {
          return referenced;
        }
        try {
          return root.machine.getStateNodeById(referenced.id);
        } catch {
        }
      }
      function reviveHistoryValue(root, historyValue) {
        if (!historyValue || typeof historyValue !== "object") {
          return {};
        }
        const revived = {};
        for (const key in historyValue) {
          const arr = historyValue[key];
          for (const item of arr) {
            const resolved = resolveHistoryReferencedState(root, item);
            if (!resolved) {
              continue;
            }
            revived[key] ??= [];
            revived[key].push(resolved);
          }
        }
        return revived;
      }
      const revivedHistoryValue = reviveHistoryValue(this.root, snapshot.historyValue);
      const restoredSnapshot = createMachineSnapshot({
        ...snapshot,
        children,
        _nodes: Array.from(getAllStateNodes(getStateNodes(this.root, snapshot.value))),
        historyValue: revivedHistoryValue
      }, this);
      const seen = /* @__PURE__ */ new Set();
      function reviveContext(contextPart, children2) {
        if (seen.has(contextPart)) {
          return;
        }
        seen.add(contextPart);
        for (const key in contextPart) {
          const value = contextPart[key];
          if (value && typeof value === "object") {
            if ("xstate$$type" in value && value.xstate$$type === $$ACTOR_TYPE) {
              contextPart[key] = children2[value.id];
              continue;
            }
            reviveContext(value, children2);
          }
        }
      }
      reviveContext(restoredSnapshot.context, children);
      return restoredSnapshot;
    }
  };

  // ../../node_modules/.pnpm/xstate@5.32.4/node_modules/xstate/dist/log-79409d72.esm.js
  function resolveEmit(_, snapshot, args, actionParams, {
    event: eventOrExpr
  }) {
    const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
    return [snapshot, {
      event: resolvedEvent
    }, void 0];
  }
  function executeEmit(actorScope, {
    event
  }) {
    actorScope.defer(() => actorScope.emit(event));
  }
  function emit(eventOrExpr) {
    function emit2(_args, _params) {
    }
    emit2.type = "xstate.emit";
    emit2.event = eventOrExpr;
    emit2.resolve = resolveEmit;
    emit2.execute = executeEmit;
    return emit2;
  }
  var SpecialTargets = /* @__PURE__ */ (function(SpecialTargets2) {
    SpecialTargets2["Parent"] = "#_parent";
    SpecialTargets2["Internal"] = "#_internal";
    return SpecialTargets2;
  })({});
  function resolveSendTo(actorScope, snapshot, args, actionParams, {
    to,
    event: eventOrExpr,
    id,
    delay
  }, extra) {
    const delaysMap = snapshot.machine.implementations.delays;
    if (typeof eventOrExpr === "string") {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Only event objects may be used with sendTo; use sendTo({ type: "${eventOrExpr}" }) instead`
      );
    }
    const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
    let resolvedDelay;
    if (typeof delay === "string") {
      const configDelay = delaysMap && delaysMap[delay];
      resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
    } else {
      resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
    }
    const resolvedTarget = typeof to === "function" ? to(args, actionParams) : to;
    let targetActorRef;
    if (typeof resolvedTarget === "string") {
      if (resolvedTarget === SpecialTargets.Parent) {
        targetActorRef = actorScope.self._parent;
      } else if (resolvedTarget === SpecialTargets.Internal) {
        targetActorRef = actorScope.self;
      } else if (resolvedTarget.startsWith("#_")) {
        targetActorRef = snapshot.children[resolvedTarget.slice(2)];
      } else {
        targetActorRef = extra.deferredActorIds?.includes(resolvedTarget) ? resolvedTarget : snapshot.children[resolvedTarget];
      }
      if (!targetActorRef) {
        throw new Error(`Unable to send event to actor '${resolvedTarget}' from machine '${snapshot.machine.id}'.`);
      }
    } else {
      targetActorRef = resolvedTarget || actorScope.self;
    }
    return [snapshot, {
      to: targetActorRef,
      targetId: typeof resolvedTarget === "string" ? resolvedTarget : void 0,
      event: resolvedEvent,
      id,
      delay: resolvedDelay
    }, void 0];
  }
  function retryResolveSendTo(_, snapshot, params) {
    if (typeof params.to === "string") {
      params.to = snapshot.children[params.to];
    }
  }
  function executeSendTo(actorScope, params) {
    actorScope.defer(() => {
      const {
        to,
        event,
        delay,
        id
      } = params;
      if (typeof delay === "number") {
        actorScope.system.scheduler.schedule(actorScope.self, to, event, delay, id);
        return;
      }
      actorScope.system._relay(
        actorScope.self,
        // at this point, in a deferred task, it should already be mutated by retryResolveSendTo
        // if it initially started as a string
        to,
        event.type === XSTATE_ERROR ? createErrorActorEvent(actorScope.self.id, event.data) : event
      );
    });
  }
  function sendTo(to, eventOrExpr, options) {
    function sendTo2(_args, _params) {
    }
    sendTo2.type = "xstate.sendTo";
    sendTo2.to = to;
    sendTo2.event = eventOrExpr;
    sendTo2.id = options?.id;
    sendTo2.delay = options?.delay;
    sendTo2.resolve = resolveSendTo;
    sendTo2.retryResolve = retryResolveSendTo;
    sendTo2.execute = executeSendTo;
    return sendTo2;
  }
  function sendParent(event, options) {
    return sendTo(SpecialTargets.Parent, event, options);
  }
  function resolveEnqueueActions(actorScope, snapshot, args, actionParams, {
    collect
  }) {
    const actions = [];
    const enqueue = function enqueue2(action) {
      actions.push(action);
    };
    enqueue.assign = (...args2) => {
      actions.push(assign(...args2));
    };
    enqueue.cancel = (...args2) => {
      actions.push(cancel(...args2));
    };
    enqueue.raise = (...args2) => {
      actions.push(raise(...args2));
    };
    enqueue.sendTo = (...args2) => {
      actions.push(sendTo(...args2));
    };
    enqueue.sendParent = (...args2) => {
      actions.push(sendParent(...args2));
    };
    enqueue.spawnChild = (...args2) => {
      actions.push(spawnChild(...args2));
    };
    enqueue.stopChild = (...args2) => {
      actions.push(stopChild(...args2));
    };
    enqueue.emit = (...args2) => {
      actions.push(emit(...args2));
    };
    collect({
      context: args.context,
      event: args.event,
      enqueue,
      check: (guard) => evaluateGuard(guard, snapshot.context, args.event, snapshot),
      self: actorScope.self,
      system: actorScope.system
    }, actionParams);
    return [snapshot, void 0, actions];
  }
  function enqueueActions(collect) {
    function enqueueActions2(_args, _params) {
    }
    enqueueActions2.type = "xstate.enqueueActions";
    enqueueActions2.collect = collect;
    enqueueActions2.resolve = resolveEnqueueActions;
    return enqueueActions2;
  }
  function resolveLog(_, snapshot, actionArgs, actionParams, {
    value,
    label
  }) {
    return [snapshot, {
      value: typeof value === "function" ? value(actionArgs, actionParams) : value,
      label
    }, void 0];
  }
  function executeLog({
    logger
  }, {
    value,
    label
  }) {
    if (label) {
      logger(label, value);
    } else {
      logger(value);
    }
  }
  function log(value = ({
    context,
    event
  }) => ({
    context,
    event
  }), label) {
    function log2(_args, _params) {
    }
    log2.type = "xstate.log";
    log2.value = value;
    log2.label = label;
    log2.resolve = resolveLog;
    log2.execute = executeLog;
    return log2;
  }

  // ../../node_modules/.pnpm/xstate@5.32.4/node_modules/xstate/dist/xstate.esm.js
  function createMachine(config, implementations) {
    return new StateMachine(config, implementations);
  }
  function setup({
    schemas,
    actors,
    actions,
    guards,
    delays
  }) {
    return {
      assign,
      sendTo,
      raise,
      log,
      cancel,
      stopChild,
      enqueueActions,
      emit,
      spawnChild,
      createStateConfig: (config) => config,
      createAction: (fn) => fn,
      createMachine: (config) => createMachine({
        ...config,
        schemas
      }, {
        actors,
        actions,
        guards,
        delays
      }),
      extend: (extended) => setup({
        schemas,
        actors,
        actions: {
          ...actions,
          ...extended.actions
        },
        guards: {
          ...guards,
          ...extended.guards
        },
        delays: {
          ...delays,
          ...extended.delays
        }
      })
    };
  }

  // ../../packages/library/consent/src/privacy-prompt-machine.ts
  var privacyPromptMachine = setup({
    types: {},
    actions: {
      stashBoot: assign(({ event }) => {
        if (event.type !== "BOOT") return {};
        return { hasStoredConsent: event.hasStoredConsent };
      }),
      setMode: assign((_, params) => ({
        mode: params.mode
      })),
      markStored: assign({ hasStoredConsent: true })
    },
    guards: {
      needsBannerOnBoot: ({ event }) => event.type === "BOOT" && !event.hasStoredConsent,
      closeCustomizeWithoutStored: ({ context }) => context.mode === "customize" && !context.hasStoredConsent
    }
  }).createMachine({
    id: "privacyPrompt",
    initial: "hidden",
    context: {
      mode: null,
      hasStoredConsent: false
    },
    states: {
      hidden: {
        on: {
          BOOT: [
            { guard: "needsBannerOnBoot", target: "banner", actions: "stashBoot" },
            { actions: "stashBoot" }
          ],
          OPEN_PREFERENCES: {
            target: "preferences",
            actions: { type: "setMode", params: { mode: "preferences" } }
          }
        }
      },
      banner: {
        entry: { type: "setMode", params: { mode: "banner" } },
        on: {
          OPEN_CUSTOMIZE: {
            target: "customize",
            actions: { type: "setMode", params: { mode: "customize" } }
          },
          ACCEPT_ALL: {
            target: "hidden",
            actions: ["markStored", { type: "setMode", params: { mode: null } }]
          },
          REJECT_NON_ESSENTIAL: {
            target: "hidden",
            actions: ["markStored", { type: "setMode", params: { mode: null } }]
          },
          OPEN_PREFERENCES: {
            target: "preferences",
            actions: { type: "setMode", params: { mode: "preferences" } }
          }
        }
      },
      customize: {
        entry: { type: "setMode", params: { mode: "customize" } },
        on: {
          SAVE: {
            target: "hidden",
            actions: ["markStored", { type: "setMode", params: { mode: null } }]
          },
          CLOSE: [
            { guard: "closeCustomizeWithoutStored", target: "banner" },
            { target: "hidden", actions: { type: "setMode", params: { mode: null } } }
          ]
        }
      },
      preferences: {
        entry: { type: "setMode", params: { mode: "preferences" } },
        on: {
          SAVE: {
            target: "hidden",
            actions: ["markStored", { type: "setMode", params: { mode: null } }]
          },
          CLOSE: { target: "hidden", actions: { type: "setMode", params: { mode: null } } }
        }
      }
    }
  });

  // ../../packages/library/consent/src/privacy-prompt-entry.ts
  var CONSENT_GRANT_EVENT = "agentStudio:consent-grant";
  var CONSENT_PREFERENCES_OPEN_EVENT = "agentStudio:consent-preferences-open";
  var ROOT_ID = "as-consent-root";
  var STYLES_ID = "as-consent-styles";
  function mountPrivacyPrompt(opts) {
    const doc = opts.document ?? (typeof document !== "undefined" ? document : void 0);
    const win = doc?.defaultView ?? (typeof window !== "undefined" ? window : void 0);
    if (!doc?.body || !win) {
      return { dispose() {
      } };
    }
    const actor = createActor(privacyPromptMachine);
    let scrollY = 0;
    let scrollLocked = false;
    const lockScroll = () => {
      if (!doc.body || !doc.documentElement) return;
      scrollY = win.scrollY || win.pageYOffset || 0;
      doc.documentElement.classList.add("as-consent-scroll-lock");
      doc.body.classList.add("as-consent-scroll-lock");
      doc.body.style.top = `-${scrollY}px`;
      scrollLocked = true;
    };
    const unlockScroll = () => {
      if (!scrollLocked) return;
      scrollLocked = false;
      doc.documentElement?.classList.remove("as-consent-scroll-lock");
      if (doc.body) {
        doc.body.classList.remove("as-consent-scroll-lock");
        doc.body.style.top = "";
      }
      win.scrollTo(0, scrollY);
    };
    const closeRoot = () => {
      doc.getElementById(ROOT_ID)?.remove();
      unlockScroll();
    };
    const paint = (mode) => {
      ensureStyles(doc);
      closeRoot();
      openPanel({
        doc,
        win,
        mode,
        opts,
        actor,
        lockScroll,
        onDecision: () => {
          dispatchGrant(doc, opts.consent);
          opts.onConsentDecision?.(opts.consent);
        }
      });
    };
    const sub = actor.subscribe((snapshot) => {
      if (snapshot.matches("hidden")) {
        closeRoot();
        return;
      }
      const mode = snapshot.context.mode;
      if (mode) paint(mode);
    });
    actor.start();
    actor.send({ type: "BOOT", hasStoredConsent: opts.consent.hasStoredConsent() });
    const onPreferencesOpen = () => {
      actor.send({ type: "OPEN_PREFERENCES" });
    };
    doc.addEventListener(CONSENT_PREFERENCES_OPEN_EVENT, onPreferencesOpen);
    const onDocClick = (ev) => {
      const target = ev.target?.closest?.(
        '[data-as-action="cookie-preferences"]'
      );
      if (!target) return;
      ev.preventDefault();
      doc.dispatchEvent(new CustomEvent(CONSENT_PREFERENCES_OPEN_EVENT));
    };
    doc.addEventListener("click", onDocClick);
    return {
      dispose() {
        sub.unsubscribe();
        doc.removeEventListener(CONSENT_PREFERENCES_OPEN_EVENT, onPreferencesOpen);
        doc.removeEventListener("click", onDocClick);
        closeRoot();
        doc.getElementById(STYLES_ID)?.remove();
        actor.stop();
      }
    };
  }
  function openPanel(args) {
    const { doc, mode, opts, actor, lockScroll, onDecision } = args;
    if (!doc.body) return;
    const root = doc.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("data-as-component", "consent-banner");
    root.setAttribute("data-as-consent-root", "1");
    root.setAttribute("role", "presentation");
    if (mode === "preferences") root.dataset.asPreferences = "true";
    const panel = doc.createElement("div");
    panel.className = "as-consent-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.tabIndex = -1;
    const selection = buildSelection(opts.consent);
    const prefs = opts.preferences ?? {
      linkLabel: "Cookie preferences",
      title: "Your privacy choices",
      saveLabel: "Save preferences",
      closeLabel: "Close"
    };
    const header = doc.createElement("div");
    header.className = "as-consent-header";
    const title = doc.createElement("h2");
    title.id = "as-consent-title";
    title.textContent = mode === "preferences" || mode === "customize" ? prefs.title : opts.banner.title;
    panel.setAttribute("aria-labelledby", "as-consent-title");
    header.appendChild(title);
    if (mode === "preferences" || mode === "customize") {
      const close = doc.createElement("button");
      close.type = "button";
      close.className = "as-consent-close";
      close.setAttribute("aria-label", prefs.closeLabel ?? "Close");
      close.textContent = "\xD7";
      close.addEventListener("click", () => {
        actor.send({ type: "CLOSE" });
      });
      header.appendChild(close);
    }
    const desc = doc.createElement("p");
    desc.textContent = opts.banner.description;
    const categoriesEl = doc.createElement("div");
    categoriesEl.className = "as-consent-categories";
    const showCategories = mode === "customize" || mode === "preferences";
    if (showCategories) {
      buildCategoryRows(doc, categoriesEl, opts.categories, selection);
    }
    const actions = doc.createElement("div");
    actions.className = "as-consent-actions";
    if (mode === "banner") {
      const accept = doc.createElement("button");
      accept.type = "button";
      accept.className = "primary";
      accept.textContent = opts.banner.acceptAllLabel;
      accept.addEventListener("click", () => {
        opts.consent.acceptAll();
        actor.send({ type: "ACCEPT_ALL" });
        onDecision();
      });
      const reject = doc.createElement("button");
      reject.type = "button";
      reject.className = "secondary";
      reject.textContent = opts.banner.rejectNonEssentialLabel;
      reject.addEventListener("click", () => {
        opts.consent.rejectNonEssential();
        actor.send({ type: "REJECT_NON_ESSENTIAL" });
        onDecision();
      });
      const customize = doc.createElement("button");
      customize.type = "button";
      customize.className = "secondary";
      customize.textContent = opts.banner.customizeLabel;
      customize.addEventListener("click", () => {
        actor.send({ type: "OPEN_CUSTOMIZE" });
      });
      actions.append(accept, reject, customize);
    } else {
      const save = doc.createElement("button");
      save.type = "button";
      save.className = "primary";
      save.textContent = prefs.saveLabel;
      save.addEventListener("click", () => {
        opts.consent.setMany(readSelection(categoriesEl, selection));
        actor.send({ type: "SAVE" });
        onDecision();
      });
      actions.appendChild(save);
    }
    const privacy = doc.createElement("a");
    privacy.className = "as-consent-privacy";
    privacy.href = opts.banner.privacyPolicyUrl;
    privacy.textContent = "Privacy policy";
    panel.append(header, desc);
    if (showCategories) panel.append(categoriesEl);
    panel.append(actions, privacy);
    root.appendChild(panel);
    doc.body.appendChild(root);
    lockScroll();
    focusWithoutScroll(panel);
  }
  function buildSelection(consent) {
    return { ...consent.categories, strictly_necessary: true };
  }
  function buildCategoryRows(doc, container, meta, selection) {
    container.replaceChildren();
    for (const id of CONSENT_CATEGORIES) {
      const catMeta = meta?.[id] ?? fallbackCategoryMeta(id);
      const row = doc.createElement("div");
      row.className = "as-consent-row";
      const copy = doc.createElement("div");
      const strong = doc.createElement("strong");
      strong.textContent = catMeta.label;
      const span = doc.createElement("span");
      span.textContent = catMeta.description;
      copy.append(strong, span);
      const toggle = doc.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = !!selection[id];
      toggle.disabled = id === "strictly_necessary";
      toggle.dataset.category = id;
      row.append(copy, toggle);
      container.appendChild(row);
    }
  }
  function readSelection(categoriesEl, fallback) {
    const next = { ...fallback, strictly_necessary: true };
    const inputs = categoriesEl.querySelectorAll("input[data-category]");
    if (!inputs.length) return next;
    for (const input of Array.from(inputs)) {
      const key = input.dataset.category;
      if (!key || key === "strictly_necessary") continue;
      if (OPTIONAL_CONSENT_CATEGORIES.includes(key)) {
        next[key] = input.checked;
      }
    }
    return next;
  }
  function fallbackCategoryMeta(id) {
    const labels = {
      strictly_necessary: {
        label: "Strictly necessary",
        description: "Required for security and basic site operation. Always on."
      },
      functional: {
        label: "Functional",
        description: "Preferences and embedded media that improve the experience."
      },
      analytics: {
        label: "Analytics",
        description: "Anonymous usage measurement."
      },
      marketing: {
        label: "Marketing",
        description: "Campaign attribution and ads."
      },
      personalization: {
        label: "Personalization",
        description: "Tailored content and experiments."
      }
    };
    return labels[id];
  }
  function ensureStyles(doc) {
    if (doc.getElementById(STYLES_ID)) return;
    if (!doc.head) return;
    const style = doc.createElement("style");
    style.id = STYLES_ID;
    style.textContent = [
      "html.as-consent-scroll-lock,body.as-consent-scroll-lock{overflow:hidden!important}",
      "body.as-consent-scroll-lock{position:fixed;width:100%;left:0;right:0}",
      `#${ROOT_ID}{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:1rem;background:rgba(15,23,42,.45);pointer-events:auto;box-sizing:border-box}`,
      ".as-consent-panel{max-width:36rem;width:100%;max-height:min(90vh,40rem);overflow:auto;background:#fff;color:#0f172a;border-radius:.75rem;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);padding:1.25rem;pointer-events:auto;box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}",
      ".as-consent-header{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:.5rem}",
      ".as-consent-header h2{margin:0;font-size:1.125rem;line-height:1.35;flex:1;font-weight:600;color:#0f172a}",
      ".as-consent-close{flex:0 0 auto;border:0;background:#f1f5f9;color:#475569;border-radius:.375rem;width:2rem;height:2rem;font-size:1.25rem;line-height:1;cursor:pointer}",
      ".as-consent-close:hover{background:#e2e8f0;color:#0f172a}",
      ".as-consent-panel>p{margin:0 0 1rem;line-height:1.5;font-size:.9375rem;color:#475569}",
      ".as-consent-actions{display:flex;flex-wrap:wrap;gap:.5rem}",
      ".as-consent-actions button{border:0;border-radius:.5rem;padding:.625rem .875rem;font-size:.875rem;font-weight:500;cursor:pointer;line-height:1.25}",
      ".as-consent-actions .primary{background:#4f46e5;color:#fff}",
      ".as-consent-actions .primary:hover{background:#4338ca}",
      ".as-consent-actions .secondary{background:#e2e8f0;color:#0f172a}",
      ".as-consent-actions .secondary:hover{background:#cbd5e1}",
      ".as-consent-categories{display:grid;gap:.75rem;margin:0 0 1rem}",
      ".as-consent-row{display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:start}",
      ".as-consent-row strong{display:block;font-size:.875rem;color:#0f172a}",
      ".as-consent-row span{display:block;font-size:.8125rem;color:#64748b;margin-top:.125rem}",
      ".as-consent-privacy{display:inline-block;margin-top:.75rem;font-size:.8125rem;color:#64748b}",
      ".as-consent-privacy:hover{color:#4f46e5}"
    ].join("");
    doc.head.appendChild(style);
  }
  function focusWithoutScroll(el) {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }
  function dispatchGrant(doc, consent) {
    doc.dispatchEvent(
      new CustomEvent(CONSENT_GRANT_EVENT, {
        detail: { categories: consent.categories }
      })
    );
  }

  // ../../packages/library/analytics/src/pageview.ts
  function collectPageviewProperties(pageMeta) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return { page_route: "/", page_url: "/", page_origin: "", search: null, query_params: {} };
    }
    const loc = window.location;
    const search = loc.search || null;
    const queryParams = parseQueryParams(search);
    return {
      page_url: loc.href,
      page_origin: loc.origin,
      page_route: loc.pathname,
      search,
      query_params: queryParams,
      hash: loc.hash || null,
      page_title: document.title,
      page_id: pageMeta?.pageId ?? null,
      page_type: pageMeta?.pageType ?? null,
      locale: pageMeta?.locale ?? null,
      browser_locale: typeof navigator !== "undefined" ? navigator.language : null,
      referrer: document.referrer || null,
      utm_source: queryParams.utm_source ?? null,
      utm_medium: queryParams.utm_medium ?? null,
      utm_campaign: queryParams.utm_campaign ?? null,
      utm_term: queryParams.utm_term ?? null,
      utm_content: queryParams.utm_content ?? null,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: typeof screen !== "undefined" ? screen.width : null,
      screen_height: typeof screen !== "undefined" ? screen.height : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
    };
  }
  function parseQueryParams(search) {
    if (!search || search === "?") return {};
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const out = {};
    for (const [k, v] of params.entries()) out[k] = v;
    return out;
  }

  // ../../packages/library/analytics/src/client.ts
  function createAnalytics(opts) {
    const { context, transport, suppressed = false, pageMeta } = opts;
    function envelope(extra = {}) {
      return {
        visitor_id: context.visitorId,
        session_id: context.sessionId,
        user_id: context.userId ?? null,
        timestamp: Date.now(),
        site_id: context.siteId,
        environment: context.environment,
        workspace_id: context.workspaceId,
        locale: context.locale ?? null,
        consent_analytics: context.consentAnalytics ?? true,
        ...extra
      };
    }
    return {
      track(eventName, properties = {}) {
        if (suppressed) return;
        const payload = {
          event_name: eventName,
          properties: envelope(properties)
        };
        void transport.track(payload);
      },
      page(extra = {}) {
        if (suppressed) return;
        const pageProps = collectPageviewProperties(pageMeta);
        const payload = {
          event_name: "pageview",
          properties: envelope({
            event_label: "Page viewed",
            ...pageProps,
            ...extra
          })
        };
        void transport.track(payload);
      },
      identify(userId, traits = {}) {
        if (suppressed) return;
        transport.identify?.(userId, traits);
      }
    };
  }

  // ../../packages/library/analytics/src/destinations-transport.ts
  function eventAllowed(dest, eventName) {
    const events = dest.events ?? "*";
    if (events === "*") return true;
    return events.includes(eventName);
  }
  function enabledHere(dest, environment) {
    const envs = dest.enabledIn ?? ["dev", "staging", "production"];
    return envs.includes(environment);
  }
  async function postJson(fetchImpl, url, body, headers = {}) {
    await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      credentials: "same-origin"
    });
  }
  function resolveFirstPartyUrl(config, path) {
    const base = typeof config?.apiBase === "string" ? config.apiBase.replace(/\/$/, "") : "";
    const customPath = typeof config?.path === "string" ? config.path : path;
    return `${base}${customPath.startsWith("/") ? customPath : `/${customPath}`}`;
  }
  function createDestinationsTransport(opts) {
    const {
      destinations,
      environment,
      consentAllows = () => true,
      fetchImpl = fetch,
      firstPartyPath = "/api/events",
      onStubSend
    } = opts;
    async function sendToDestination(dest, payload) {
      const config = dest.config ?? {};
      switch (dest.provider) {
        case "first-party": {
          const url = resolveFirstPartyUrl(config, firstPartyPath);
          await postJson(fetchImpl, url, payload);
          return;
        }
        case "webhook": {
          const url = typeof config.url === "string" ? config.url : "";
          if (!url) return;
          await postJson(fetchImpl, url, payload);
          return;
        }
        case "ga4": {
          const measurementId = typeof config.measurementId === "string" ? config.measurementId : "";
          const apiSecret = typeof config.apiSecret === "string" ? config.apiSecret : "";
          const clientId = typeof payload.properties?.visitor_id === "string" ? payload.properties.visitor_id : "anonymous";
          if (!measurementId || !apiSecret) return;
          const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
          await postJson(fetchImpl, url, {
            client_id: clientId,
            events: [
              {
                name: payload.event_name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40),
                params: payload.properties ?? {}
              }
            ]
          });
          return;
        }
        case "posthog": {
          const apiKey = typeof config.apiKey === "string" ? config.apiKey : "";
          const host = typeof config.host === "string" ? config.host.replace(/\/$/, "") : "https://us.i.posthog.com";
          if (!apiKey) return;
          const distinctId = typeof payload.properties?.visitor_id === "string" ? payload.properties.visitor_id : "anonymous";
          await postJson(fetchImpl, `${host}/capture/`, {
            api_key: apiKey,
            event: payload.event_name,
            properties: {
              distinct_id: distinctId,
              ...payload.properties ?? {}
            }
          });
          return;
        }
        case "segment":
        case "plausible":
        case "umami": {
          onStubSend?.(dest.provider, payload);
          return;
        }
        default:
          return;
      }
    }
    return {
      track(payload) {
        if (!consentAllows("analytics") && payload.event_name !== "consent_updated") {
          return;
        }
        const jobs = [];
        for (const dest of destinations) {
          if (!enabledHere(dest, environment)) continue;
          if (!eventAllowed(dest, payload.event_name)) continue;
          jobs.push(sendToDestination(dest, payload));
        }
        void Promise.allSettled(jobs);
      },
      identify(userId, traits) {
        if (!consentAllows("analytics")) return;
        const payload = {
          event_name: "identify",
          properties: { user_id: userId, ...traits ?? {} }
        };
        this.track(payload);
      }
    };
  }

  // ../../packages/library/analytics/src/schemas.ts
  var PROVIDERS = /* @__PURE__ */ new Set([
    "first-party",
    "posthog",
    "ga4",
    "segment",
    "plausible",
    "umami",
    "webhook"
  ]);
  function parseAnalyticsIntegration(input) {
    if (!input || typeof input !== "object") return { ok: false, error: "expected object" };
    const doc = input;
    if (doc.kind !== "analytics") return { ok: false, error: 'kind must be "analytics"' };
    const destinations = Array.isArray(doc.destinations) ? doc.destinations : [];
    for (const d of destinations) {
      if (!d || typeof d !== "object") return { ok: false, error: "invalid destination" };
      const provider = d.provider;
      if (!provider || !PROVIDERS.has(provider)) {
        return { ok: false, error: `unknown destination provider: ${String(provider)}` };
      }
    }
    return {
      ok: true,
      value: {
        id: typeof doc.id === "string" ? doc.id : void 0,
        kind: "analytics",
        store: typeof doc.store === "string" ? doc.store : void 0,
        destinations,
        funnels: Array.isArray(doc.funnels) ? doc.funnels : void 0
      }
    };
  }
  var REQUIRED_CATS = [
    "strictly_necessary",
    "functional",
    "analytics",
    "marketing",
    "personalization"
  ];
  function parseConsentIntegration(input) {
    if (!input || typeof input !== "object") return { ok: false, error: "expected object" };
    const doc = input;
    if (doc.kind !== "consent") return { ok: false, error: 'kind must be "consent"' };
    const banner = doc.banner;
    if (!banner?.title || !banner.description) {
      return { ok: false, error: "banner.title and banner.description required" };
    }
    const categories = doc.categories;
    if (!categories) return { ok: false, error: "categories required" };
    for (const cat of REQUIRED_CATS) {
      if (!categories[cat]?.label || !categories[cat]?.description) {
        return { ok: false, error: `categories.${cat} label+description required` };
      }
    }
    const preferences = doc.preferences;
    if (!preferences?.linkLabel || !preferences.title || !preferences.saveLabel) {
      return { ok: false, error: "preferences linkLabel/title/saveLabel required" };
    }
    return {
      ok: true,
      value: {
        id: typeof doc.id === "string" ? doc.id : void 0,
        kind: "consent",
        label: typeof doc.label === "string" ? doc.label : void 0,
        provider: typeof doc.provider === "string" ? doc.provider : void 0,
        policyVersion: typeof doc.policyVersion === "string" ? doc.policyVersion : "1",
        banner: {
          title: banner.title,
          description: banner.description,
          acceptAllLabel: banner.acceptAllLabel ?? "Accept all",
          rejectNonEssentialLabel: banner.rejectNonEssentialLabel ?? "Reject non-essential",
          customizeLabel: banner.customizeLabel ?? "Customize",
          privacyPolicyUrl: banner.privacyPolicyUrl ?? "/privacy"
        },
        categories,
        preferences: {
          ...preferences,
          closeLabel: preferences.closeLabel ?? "Close"
        },
        transparency: doc.transparency && typeof doc.transparency === "object" ? doc.transparency : void 0
      }
    };
  }

  // ../../packages/library/identity/src/constants.ts
  var VISITOR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 395;
  var SESSION_IDLE_MS = 30 * 60 * 1e3;

  // ../../packages/library/identity/src/ids.ts
  function mintId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `as-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
  function mintVisitorId() {
    return mintId();
  }
  function mintSessionId() {
    return mintId();
  }

  // src/analytics/boot-pure.ts
  function bootAnalyticsConsent(input) {
    const analyticsParsed = parseAnalyticsIntegration(input.analyticsJson);
    const consentParsed = parseConsentIntegration(input.consentJson);
    if (!consentParsed.ok) {
      throw new Error(`invalid consent.json: ${consentParsed.error}`);
    }
    if (!analyticsParsed.ok) {
      throw new Error(`invalid analytics.json: ${analyticsParsed.error}`);
    }
    const consent = createConsentApi({
      siteId: input.siteId,
      policyVersion: consentParsed.value.policyVersion ?? input.policyVersion ?? "1",
      storage: input.storage
    });
    const destinations = analyticsParsed.value.destinations;
    const environment = input.environment ?? "dev";
    const transport = createDestinationsTransport({
      destinations,
      environment,
      consentAllows: (cat) => cat === "analytics" ? consent.has("analytics") : true,
      fetchImpl: input.fetchImpl
    });
    const analytics = createAnalytics({
      context: {
        siteId: input.siteId,
        environment,
        workspaceId: "production",
        visitorId: input.visitorId ?? mintVisitorId(),
        sessionId: input.sessionId ?? mintSessionId(),
        consentAnalytics: consent.has("analytics")
      },
      transport,
      suppressed: input.suppressed ?? false
    });
    return {
      consent,
      analytics,
      transport,
      destinations,
      banner: consentParsed.value.banner,
      categories: consentParsed.value.categories,
      preferences: consentParsed.value.preferences,
      shouldShowBanner: !consent.hasStoredConsent(),
      maybePage: () => {
        if (consent.has("analytics")) analytics.page();
      }
    };
  }

  // client/analytics/entry.ts
  function run() {
    const cfg = window.__AS_ANALYTICS_BOOT__;
    if (!cfg) return;
    const boot = bootAnalyticsConsent({
      siteId: cfg.siteId,
      analyticsJson: cfg.analytics,
      consentJson: cfg.consent,
      environment: cfg.environment ?? "dev",
      // Persist Accept/Reject — memory storage made Live iframe reloads re-banner.
      storage: window.localStorage
    });
    window.agentStudio = {
      consent: boot.consent,
      analytics: boot.analytics ?? void 0
    };
    const startTracking = () => boot.maybePage();
    if (boot.shouldShowBanner) {
      mountPrivacyPrompt({
        consent: boot.consent,
        banner: boot.banner,
        categories: boot.categories,
        preferences: boot.preferences,
        onConsentDecision: startTracking
      });
    } else {
      startTracking();
    }
    document.addEventListener(CONSENT_GRANT_EVENT, () => startTracking());
  }
  run();
})();
//# sourceMappingURL=analytics-client.js.map
