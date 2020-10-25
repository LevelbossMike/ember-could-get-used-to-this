import {
  setHelperManager,
  capabilities as helperCapabilities,
} from '@ember/helper';
import { setOwner } from '@ember/application';
import { destroy, registerDestructor } from '@ember/destroyable';
import { assert } from '@ember/debug';

export class Resource {
  constructor(ownerOrThunk, args) {
    if (typeof ownerOrThunk === 'function') {
      return { definition: this.constructor, args: ownerOrThunk };
    }

    setOwner(this, ownerOrThunk);
    this.args = args;
  }

  setup() {}
}

class ResourceManager {
  capabilities = helperCapabilities('3.23', {
    hasValue: true,
    hasDestroyable: true,
  });

  constructor(owner) {
    this.owner = owner;
  }

  createHelper(Class, args) {
    let state = {
      Class,
      args,
    };

    this.setupInstance(state);

    return state;
  }

  getValue(state) {
    let { instance } = state;

    if (typeof instance.update === 'function') {
      instance.update();
    } else {
      destroy(instance);
      this.setupInstance(state);
      instance = state.instance;
    }

    return instance.value;
  }

  setupInstance(state) {
    let { Class, args } = state;

    let instance = new Class(this.owner, args);
    instance.setup();

    if (typeof instance.teardown === 'function') {
      registerDestructor(instance, () => instance.teardown());
    }

    state.instance = instance;
  }

  getDestroyable(state) {
    if (typeof state.instance.update === 'function') {
      return state.instance;
    } else {
      registerDestructor(state, () => destroy(state.instance));
      return state;
    }
  }

  getDebugName(fn) {
    return fn.name || '(anonymous function)';
  }
}

setHelperManager((owner) => new ResourceManager(owner), Resource);
