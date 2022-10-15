import { eq } from 'biggystring'
import React, { useEffect } from 'react'
import { Platform, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import Animated, { AnimationCallback, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { Fontello } from '../../assets/vector'
import { useHandler } from '../../hooks/useHandler'
import { formatNumberInput, isValidInput } from '../../locales/intl'
import s from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { NumericInput } from '../modals/NumericInput'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { ButtonBox } from './ThemedButtons'

export interface FlipInputGetMethodsResponse {
  setAmounts: (value: string[]) => void
}

export type FieldNum = 0 | 1
export type FlipInputFieldInfo = {
  currencyName: string

  // Maximum number of decimals to allow the user to enter. FlipInput will automatically truncate use input to this
  // number of decimals as the user types.
  maxEntryDecimals: number
}

export interface FlipInputProps {
  onNext?: () => void
  convertValue: (sourceFieldNum: FieldNum, value: string) => Promise<string | undefined>
  getMethods?: (methods: FlipInputGetMethodsResponse) => void
  startAmounts: [string, string]
  inputAccessoryViewID?: string
  fieldInfos: FlipInputFieldInfo[]
  topReturnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send'
}

const FLIP_DURATION = 500
const flipField = (fieldNum: FieldNum): FieldNum => {
  return fieldNum === 0 ? 1 : 0
}

export const FlipInput2 = React.memo((props: FlipInputProps) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const inputRefs = [React.useRef<TextInput>(null), React.useRef<TextInput>(null)]

  const { startAmounts, fieldInfos, topReturnKeyType = 'done', onNext, inputAccessoryViewID, getMethods, convertValue } = props
  const animatedValue = useSharedValue(0)

  // `amounts` is always a 2-tuple
  const [amounts, setAmounts] = useState<[string, string]>(startAmounts)

  // primaryField is the index into the 2-tuple, 0 or 1
  const [primaryField, setPrimaryField] = useState<FieldNum>(0)

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const degrees = interpolate(animatedValue.value, [0, 0.5, 1], [0, 90, 90])
    return {
      transform: [{ rotateX: `${degrees}deg` }]
    }
  })
  const backAnimatedStyle = useAnimatedStyle(() => {
    const degrees = interpolate(animatedValue.value, [0, 0.5, 1], [90, 90, 0])
    return {
      transform: [{ rotateX: `${degrees}deg` }]
    }
  })

  const onToggleFlipInput = useHandler(() => {
    const jsCallback: AnimationCallback = done => {
      'worklet'
      if (done) runOnJS(setPrimaryField)(primaryField ? 0 : 1)
    }
    inputRefs[primaryField].current?.blur()
    inputRefs[Number(!primaryField)].current?.focus()

    if (primaryField) {
      console.log('animating to 0')
      animatedValue.value = withTiming(
        0,
        {
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease)
        },
        jsCallback
      )
    }
    if (!primaryField) {
      console.log('animating to 1')
      animatedValue.value = withTiming(
        1,
        {
          duration: FLIP_DURATION,
          easing: Easing.inOut(Easing.ease)
        },
        jsCallback
      )
    }
  })

  const onNumericInputChange = useHandler((text: string) => {
    convertValue(primaryField, text)
      .then(amount => {
        if (amount != null) {
          const otherField = flipField(primaryField)
          const newAmounts: [string, string] = ['', '']
          newAmounts[primaryField] = text
          newAmounts[otherField] = amount
          setAmounts(newAmounts)
        }
      })
      .catch(e => showError(e.message))
  })

  const bottomRow = useHandler((fieldNum: FieldNum) => {
    const primaryAmount = amounts[fieldNum]
    const amountBlank = eq(primaryAmount, '0')
    const currencyNameStyle = amountBlank ? styles.bottomCurrencyMuted : styles.bottomCurrency
    const currencyName = fieldInfos[fieldNum].currencyName

    return (
      <View style={styles.bottomContainer} key="bottom">
        <View style={styles.valueContainer}>
          <NumericInput
            style={styles.bottomAmount}
            value={primaryAmount}
            maxDecimals={fieldInfos[fieldNum].maxEntryDecimals}
            placeholder={amountBlank ? s.strings.string_amount : ''}
            placeholderTextColor={theme.deactivatedText}
            onChangeText={onNumericInputChange}
            autoCorrect={false}
            returnKeyType={topReturnKeyType}
            ref={inputRefs[fieldNum]}
            onSubmitEditing={onNext}
            inputAccessoryViewID={inputAccessoryViewID}
          />
          <EdgeText style={currencyNameStyle}>{' ' + currencyName}</EdgeText>
        </View>
      </View>
    )
  })

  const topRow = useHandler((fieldNum: FieldNum) => {
    let topText = amounts[fieldNum]
    if (isValidInput(topText)) {
      topText = formatNumberInput(topText, { minDecimals: 0, maxDecimals: fieldInfos[fieldNum].maxEntryDecimals })
    }

    const fieldInfo = fieldInfos[fieldNum]
    topText = `${topText} ${fieldInfo.currencyName}`
    return (
      <TouchableWithoutFeedback onPress={onToggleFlipInput} key="top">
        <EdgeText>{topText}</EdgeText>
      </TouchableWithoutFeedback>
    )
  })

  useEffect(() => {
    if (getMethods != null)
      getMethods({
        setAmounts: amounts => {
          setAmounts([amounts[0], amounts[1]])
        }
      })
  }, [])

  return (
    <>
      <View style={styles.flipInputContainer}>
        <View style={styles.flipInput}>
          <Animated.View style={[styles.flipInputFront, frontAnimatedStyle]} pointerEvents={flipField(primaryField) ? 'auto' : 'none'}>
            {topRow(1)}
            {bottomRow(0)}
          </Animated.View>
          <Animated.View style={[styles.flipInputFront, styles.flipContainerBack, backAnimatedStyle]} pointerEvents={primaryField ? 'auto' : 'none'}>
            {topRow(0)}
            {bottomRow(1)}
          </Animated.View>
        </View>
        <ButtonBox onPress={onToggleFlipInput} paddingRem={[0.5, 0, 0.5, 1]}>
          <Fontello style={styles.flipIcon} name="exchange" color={theme.iconTappable} size={theme.rem(1.5)} />
        </ButtonBox>
      </View>
    </>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  // Flip Input
  flipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  flipInput: {
    flex: 1,
    paddingRight: theme.rem(0.5)
  },
  flipInputFront: {
    backfaceVisibility: 'hidden'
  },
  flipContainerBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  flipIcon: {
    marginRight: -theme.rem(0.125)
  },

  // Top Amount
  bottomContainer: {
    flexDirection: 'row',
    marginRight: theme.rem(1.5),
    minHeight: theme.rem(2)
  },
  valueContainer: {
    flexDirection: 'row',
    marginRight: theme.rem(0.5),
    marginLeft: Platform.OS === 'ios' ? 0 : -3,
    marginTop: Platform.OS === 'ios' ? 0 : -theme.rem(0.75),
    marginBottom: Platform.OS === 'ios' ? 0 : -theme.rem(1)
  },
  bottomAmount: {
    paddingRight: Platform.OS === 'ios' ? 0 : theme.rem(0.25),
    color: theme.primaryText,
    includeFontPadding: false,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.5)
  },
  bottomCurrency: {
    paddingTop: Platform.OS === 'ios' ? theme.rem(0.125) : theme.rem(1)
  },
  bottomCurrencyMuted: {
    paddingTop: Platform.OS === 'ios' ? theme.rem(0.125) : theme.rem(1),
    color: theme.deactivatedText
  }
}))
