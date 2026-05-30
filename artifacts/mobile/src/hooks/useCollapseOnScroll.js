import { useRef, useCallback, useState } from 'react';
import { Animated } from 'react-native';

const SHOW_AT_TOP = 16;
const MIN_SCROLL_TO_HIDE = 40;
const SCROLL_DOWN_DELTA = 6;
const SCROLL_UP_DELTA = 6;

/**
 * Collapses content when the user scrolls down; expands when near top or scrolling up.
 */
export default function useCollapseOnScroll() {
  const collapse = useRef(new Animated.Value(1)).current;
  const lastY = useRef(0);
  const collapsedRef = useRef(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const onCollapsibleLayout = useCallback((e) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && height !== measuredHeight) {
      setMeasuredHeight(height);
    }
  }, [measuredHeight]);

  const animateTo = useCallback((toCollapsed) => {
    if (collapsedRef.current === toCollapsed) return;
    collapsedRef.current = toCollapsed;
    Animated.timing(collapse, {
      toValue: toCollapsed ? 0 : 1,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [collapse]);

  const onScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastY.current;
    lastY.current = y;

    if (y <= SHOW_AT_TOP) {
      animateTo(false);
      return;
    }
    if (delta > SCROLL_DOWN_DELTA && y > MIN_SCROLL_TO_HIDE) {
      animateTo(true);
    } else if (delta < -SCROLL_UP_DELTA) {
      animateTo(false);
    }
  }, [animateTo]);

  const collapsibleStyle = measuredHeight > 0
    ? {
      overflow: 'hidden',
      opacity: collapse,
      height: collapse.interpolate({
        inputRange: [0, 1],
        outputRange: [0, measuredHeight],
      }),
    }
    : { overflow: 'hidden' };

  return { onScroll, onCollapsibleLayout, collapsibleStyle };
}
