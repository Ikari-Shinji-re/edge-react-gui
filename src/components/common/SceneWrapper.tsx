import { getDefaultHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useMemo } from 'react'
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { EdgeInsets, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { maybeComponent } from '../hoc/maybeComponent'
import { NotificationView } from '../notification/NotificationView'
import { useTheme } from '../services/ThemeContext'
import { MAX_TAB_BAR_HEIGHT } from '../themed/MenuTabs'
import { DotsBackground } from '../ui4/DotsBackground'
import { KeyboardTracker } from './KeyboardTracker'

export interface InsetStyles {
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

export interface SceneWrapperInfo {
  insets: EdgeInsets
  insetStyles: InsetStyles
  hasTabs: boolean
  isKeyboardOpen: boolean
}

interface SceneWrapperProps {
  // The children can either be normal React elements,
  // or a function that accepts info about the scene outer state and returns an element.
  // The function will be called on each render, allowing the scene to react
  // to changes to the info.
  children: React.ReactNode | ((info: SceneWrapperInfo) => React.ReactNode)

  // Adjusts the blurred dots background:
  accentColor?: string

  // True if this scene should shrink to avoid the keyboard:
  avoidKeyboard?: boolean

  // True if this scene has a header (with back button & such):
  hasHeader?: boolean

  // This enables notifications in the scene
  hasNotifications?: boolean

  // True if this scene has a bottom tab bar:
  hasTabs?: boolean

  // Settings for when using ScrollView
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'

  // Padding to add inside the scene border:
  padding?: number

  // True to make the scene scrolling (if avoidKeyboard is false):
  scroll?: boolean
}

/**
 * Wraps a normal stacked scene, creating a perfectly-sized box
 * that avoids the header, tab bar, and notifications (if any).
 * Also draws a common gradient background under the scene.
 *
 * If the children are normal React elements, then the wrapper will apply
 * padding needed to avoid the safe area inset and header/tab-bar/etc.
 *
 * If the child is a function component, though, the scene rendering SceneWrapper
 * is responsible for applying its own padding. The scene can leverage the
 * provided `info` parameter passed to the children function-prop for this
 * purpose.
 */
export function SceneWrapper(props: SceneWrapperProps): JSX.Element {
  const {
    accentColor,
    avoidKeyboard = false,
    children,
    hasHeader = true,
    hasNotifications = false,
    hasTabs = false,
    keyboardShouldPersistTaps,
    padding = 0,
    scroll = false
  } = props

  const accountId = useSelector(state => state.core.account.id)
  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = accountId != null && activeUsername == null

  const navigation = useNavigation<NavigationBase>()
  const theme = useTheme()
  const windowDimensions = useWindowDimensions()
  const layoutStyles = useMemo(
    () => ({
      height: windowDimensions.height,
      width: windowDimensions.width
    }),
    [windowDimensions.height, windowDimensions.width]
  )

  // Subscribe to the window size:
  const frame = useSafeAreaFrame()
  const safeAreaInsets = useSafeAreaInsets()

  const notificationHeight = theme.rem(4)
  const headerBarHeight = getDefaultHeaderHeight(frame, false, 0)

  const renderScene = (safeAreaInsets: EdgeInsets, keyboardAnimation: Animated.Value | undefined, trackerValue: number): JSX.Element => {
    // If function children, the caller handles the insets and overscroll
    const hasKeyboardAnimation = keyboardAnimation != null
    const isFuncChildren = typeof children === 'function'

    // Derive the keyboard height by getting the difference between screen height
    // and trackerValue. This value should be from zero to keyboard height
    // depending on the open state of the keyboard
    const keyboardHeight = frame.height - trackerValue
    const isKeyboardOpen = keyboardHeight !== 0

    // These are the safeAreaInsets including the app's header and tab-bar
    // heights.
    const insets: EdgeInsets = {
      top: safeAreaInsets.top + (hasHeader ? headerBarHeight : 0),
      right: safeAreaInsets.right,
      bottom: (isLightAccount ? notificationHeight : 0) + (hasTabs ? MAX_TAB_BAR_HEIGHT : isKeyboardOpen ? 0 : safeAreaInsets.bottom),
      left: safeAreaInsets.left
    }

    // This is a convenient styles object which may be applied as
    // contentContainerStyles for child scroll components. It will also be
    // used for the ScrollView component internal to the SceneWrapper.
    const insetStyles: InsetStyles = {
      paddingTop: insets.top,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left
    }

    const maybeInsetStyles = isFuncChildren ? {} : insetStyles

    const info: SceneWrapperInfo = { insets, insetStyles, hasTabs, isKeyboardOpen }

    return (
      <MaybeAnimatedView when={hasKeyboardAnimation} style={[styles.sceneContainer, layoutStyles, maybeInsetStyles, { maxHeight: keyboardAnimation, padding }]}>
        <DotsBackground accentColor={accentColor} />
        <MaybeScrollView
          when={scroll && !hasKeyboardAnimation}
          style={[layoutStyles, { padding }]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          contentContainerStyle={insetStyles}
        >
          <MaybeView when={!scroll && !hasKeyboardAnimation} style={[styles.sceneContainer, layoutStyles, maybeInsetStyles]}>
            {isFuncChildren ? children(info) : children}
            {hasNotifications ? <NotificationView navigation={navigation} /> : null}
          </MaybeView>
        </MaybeScrollView>
      </MaybeAnimatedView>
    )
  }

  // These represent the distance from the top of the screen to the top of
  // the keyboard depending if the keyboard is down or up.
  const downValue = frame.height
  const upValue = (keyboardHeight: number) => downValue - keyboardHeight

  return avoidKeyboard ? (
    <KeyboardTracker downValue={downValue} upValue={upValue}>
      {(keyboardAnimation, trackerValue) =>
        renderScene(
          safeAreaInsets,
          keyboardAnimation /* Animation between downValue and upValue */,
          trackerValue /* downValue or upValue depending on if the keyboard state */
        )
      }
    </KeyboardTracker>
  ) : (
    renderScene(safeAreaInsets, undefined, 0)
  )
}

const styles = StyleSheet.create({
  sceneContainer: {
    // Children:
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  }
})

const MaybeAnimatedView = maybeComponent(Animated.View)
const MaybeScrollView = maybeComponent(ScrollView)
const MaybeView = maybeComponent(View)
