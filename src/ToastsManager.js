/* eslint-disable no-shadow,react/no-unused-state */
import React, { PureComponent, createRef } from 'react';
import styled, { keyframes } from 'styled-components';
import is from 'styled-is';

import Toast from './Toast';

const LIMIT = 3;
const HIDE_TIMEOUT = 7000;
const HIDE_LEAVE_TIMEOUT = 5000;

const fromBottomAnimation = keyframes`
  from {
    transform: translate(0, 1000px);
  }
  to {
    transform: translate(0, 0);
  }
`;

const toLeftAnimation = keyframes`
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(-500px, 0);
  }
`;

const Wrapper = styled.div`
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 8px;
  z-index: 200;

  @media (min-width: 500px) {
    left: 30px;
    right: 30px;
    bottom: 22px;
  }
`;

const ToastContainer = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  max-width: 100%;
  padding-bottom: 8px;
  transition: transform 0.3s ease-out;
  transform: translate(0, -${({ bottomOffset }) => bottomOffset}px);

  ${is('isInvisible')`
    visibility: hidden;
  `};
`;

const ToastWrapper = styled.div`
  ${is('isAppearing')`
    animation: ${fromBottomAnimation} 0.4s ease-out;
  `};

  ${is('isHiding')`
    animation: ${toLeftAnimation} 0.3s ease-in forwards;
  `};
`;

let instance;

function addToast(params) {
  if (!instance) {
    throw new Error('ToastsManager is not mounted');
  }

  setTimeout(() => {
    instance.addToast(params);
  }, 0);
}

/**
 * Компонент довольно сильно усложнен для поддержки красивых анимаций тостов
 */
export default class ToastsManager extends PureComponent {
  static info(text) {
    addToast({
      type: 'info',
      text,
    });
  }

  static warn(text) {
    addToast({
      type: 'warn',
      text,
    });
  }

  static error(text) {
    addToast({
      type: 'error',
      text,
    });
  }

  static show(renderer) {
    addToast({
      type: 'component',
      renderer,
    });
  }

  lastId = 0;

  toastsRefs = {};

  hideTimeouts = [];

  clearingTimeouts = [];

  state = {
    currentToasts: [],
    delayedQueue: [],
    heights: {},
    bottomOffsets: {},
    isHovered: false,
  };

  constructor(props) {
    super(props);
    instance = this;
  }

  componentDidMount() {
    window.addEventListener('blur', this.onLeave);
  }

  componentDidUpdate(_, prevState) {
    const { currentToasts } = this.state;

    const prevLength = prevState.currentToasts.length;

    if (currentToasts.length && !prevLength) {
      window.addEventListener('resize', this.onResize);
    } else if (!currentToasts.length && prevLength) {
      window.removeEventListener('resize', this.onResize);
    }

    this.checkHeights();
  }

  componentWillUnmount() {
    instance = null;

    window.removeEventListener('blur', this.onLeave);

    for (const id of this.hideTimeouts) {
      clearTimeout(id);
    }

    for (const id of this.clearingTimeouts) {
      clearTimeout(id);
    }
  }

  onCloseClick = id => {
    this.startToastsHiding(id);
  };

  onMouseEnter = () => {
    this.setState({
      isHovered: true,
    });

    for (const id of this.hideTimeouts) {
      clearTimeout(id);
    }
  };

  onLeave = () => {
    const { currentToasts } = this.state;

    this.setState({
      isHovered: false,
    });

    if (!currentToasts.length) {
      return;
    }

    const hideIds = new Set(currentToasts.map(({ id }) => id));

    const timeoutId = setTimeout(() => {
      this.startToastsHiding(hideIds);
    }, HIDE_LEAVE_TIMEOUT);

    this.hideTimeouts.push(timeoutId);
  };

  onResize = () => {
    this.checkHeights();
  };

  getActiveToastsCount() {
    const { currentToasts } = this.state;

    return currentToasts.filter(toast => !toast.isHiding).length;
  }

  checkDelayedQueue() {
    const { delayedQueue } = this.state;

    if (delayedQueue.length && this.getActiveToastsCount() < LIMIT) {
      const [firstToast, ...other] = delayedQueue;

      this.setState(
        {
          delayedQueue: other,
        },
        () => {
          this.checkDelayedQueue();
        }
      );

      this.showToast(firstToast);
    }
  }

  startToastsHiding(ids) {
    if (!(ids instanceof Set)) {
      // eslint-disable-next-line no-param-reassign
      ids = new Set([ids]);
    }

    const { currentToasts } = this.state;

    this.setState(
      {
        currentToasts: currentToasts.map(toast => {
          if (ids.has(toast.id)) {
            return {
              ...toast,
              isHiding: true,
            };
          }

          return toast;
        }),
      },
      () => {
        this.checkDelayedQueue();
      }
    );

    this.clearingTimeouts.push(
      setTimeout(() => {
        this.removeToasts(ids);
      }, 400)
    );
  }

  addToast(toastParams) {
    const { delayedQueue } = this.state;

    if (this.getActiveToastsCount() >= LIMIT) {
      this.setState({
        delayedQueue: delayedQueue.concat(toastParams),
      });
      return;
    }

    this.showToast(toastParams);
  }

  showToast({ type, text, renderer }) {
    const { currentToasts, isHovered } = this.state;

    this.lastId += 1;

    const id = this.lastId;

    this.toastsRefs[id] = createRef();

    if (!isHovered) {
      this.startToastHideTimeout(id);
    }

    this.setState({
      currentToasts: currentToasts.concat({
        id,
        type,
        text,
        renderer,
      }),
    });
  }

  removeToasts(ids) {
    const { currentToasts } = this.state;

    this.setState({
      currentToasts: currentToasts.filter(toast => !ids.has(toast.id)),
    });
  }

  calcOffsets(heights) {
    const { currentToasts, bottomOffsets } = this.state;

    const newBottomOffsets = {};
    let totalOffset = 0;

    for (let i = currentToasts.length - 1; i >= 0; i -= 1) {
      const { id, isHiding } = currentToasts[i];

      if (isHiding) {
        newBottomOffsets[id] = bottomOffsets[id];
      } else {
        const height = heights[id];
        let bottomOffset;

        if (height) {
          bottomOffset = totalOffset;
          totalOffset += height;
        } else {
          // TODO:
          bottomOffset = 0;
        }

        newBottomOffsets[id] = bottomOffset;
      }
    }

    this.setState({
      heights,
      bottomOffsets: newBottomOffsets,
    });
  }

  checkHeights() {
    const { currentToasts, heights } = this.state;

    const newHeights = {};
    let heightsUpdated = false;

    for (const id of Object.keys(this.toastsRefs)) {
      const ref = this.toastsRefs[id];

      if (ref.current) {
        const toast = currentToasts.find(toast => toast.id === Number(id));
        const height = toast.isHiding ? 0 : ref.current.clientHeight;

        newHeights[id] = height;

        if (heights[id] === undefined || heights[id] !== height) {
          heightsUpdated = true;
        }
      }
    }

    if (heightsUpdated) {
      this.calcOffsets(newHeights);
    }
  }

  startToastHideTimeout(id) {
    const timeoutId = setTimeout(() => {
      this.startToastsHiding(id);
    }, HIDE_TIMEOUT);

    this.hideTimeouts.push(timeoutId);
  }

  renderToasts() {
    const { renderToast } = this.props;
    const { currentToasts, bottomOffsets } = this.state;

    return currentToasts.map(({ id, type, text, renderer, isHiding }) => {
      const bottomOffset = bottomOffsets[id];
      const isOffsetCalculated = bottomOffset !== undefined;

      const render = renderer || renderToast;

      return (
        <ToastContainer
          key={id}
          ref={this.toastsRefs[id]}
          isInvisible={!isOffsetCalculated}
          bottomOffset={bottomOffset}
        >
          <ToastWrapper isAppearing={isOffsetCalculated} isHiding={isHiding}>
            {render ? (
              render({ type, text, onClose: () => this.onCloseClick(id) })
            ) : (
              <Toast>{text}</Toast>
            )}
          </ToastWrapper>
        </ToastContainer>
      );
    });
  }

  render() {
    return (
      <Wrapper onMouseEnter={this.onMouseEnter} onMouseLeave={this.onLeave}>
        {this.renderToasts()}
      </Wrapper>
    );
  }
}
