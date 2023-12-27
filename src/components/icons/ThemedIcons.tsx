import React from 'react'
import Animated, { AnimatedProps, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { IconProps as VectorIconProps } from 'react-native-vector-icons/Icon'

import { Fontello } from '../../assets/vector'
import { useTheme } from '../services/ThemeContext'

//
// Types

//

export interface AnimatedIconProps {
  color?: SharedValue<string>
  size?: SharedValue<number>
}
export type AnimatedIconComponent = React.FunctionComponent<AnimatedIconProps>

export interface IconProps {
  color?: string
  size?: number
}
export type IconComponent = React.FunctionComponent<IconProps>

//
// HOCs
//

function makeAnimatedFontIcon(IconComponent: React.ComponentType<AnimatedProps<VectorIconProps>>, name: string): AnimatedIconComponent {
  return (props: AnimatedIconProps) => {
    const { color, size } = props
    const { icon, rem } = useTheme()
    const oneRem = rem(1)

    const style = useAnimatedStyle(() => ({
      color: color?.value ?? icon,
      fontSize: size?.value ?? oneRem
    }))

    return <IconComponent name={name} adjustsFontSizeToFit style={style} />
  }
}

function makeFontIcon(IconComponent: React.ComponentType<VectorIconProps>, name: string): IconComponent {
  return (props: IconProps) => {
    const { icon, rem } = useTheme()
    const { color = icon, size = rem(1) } = props

    const style = {
      color: color,
      fontSize: size
    }
    return <IconComponent name={name} adjustsFontSizeToFit style={style} />
  }
}

//
// Icons
//

const AnimatedAntDesignIcon = Animated.createAnimatedComponent(AntDesignIcon)
const AnimatedFontello = Animated.createAnimatedComponent(Fontello)

export const CloseIcon = makeFontIcon(AntDesignIcon, 'close')
export const CloseIconAnimated = makeAnimatedFontIcon(AnimatedAntDesignIcon, 'close')

export const FlipIcon = makeFontIcon(Fontello, 'exchange')
export const FlipIconAnimated = makeAnimatedFontIcon(AnimatedFontello, 'exchange')

export const SearchIcon = makeFontIcon(AntDesignIcon, 'search1')
export const SearchIconAnimated = makeAnimatedFontIcon(AnimatedAntDesignIcon, 'search1')