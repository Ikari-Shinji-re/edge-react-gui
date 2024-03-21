import { div, log10, mul, round } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import React, { useMemo } from 'react'
import { ReturnKeyType, TouchableOpacity, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { emptyEdgeDenomination, getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, getDenomFromIsoCode, maxPrimaryCurrencyConversionDecimals, precisionAdjust } from '../../util/utils'
import { styled } from '../hoc/styled'
import { Space } from '../layout/Space'
import { ButtonUi4 } from '../ui4/ButtonUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { EdgeText } from './EdgeText'
import { FieldNum, FlipInputFieldInfos, FlipInputNew, FlipInputRef } from './FlipInputNew'

export type ExchangeFlipInputFields = 'fiat' | 'crypto'

export interface SwapInputCardInputRef {
  setAmount: (field: ExchangeFlipInputFields, value: string) => void
}

export interface SwapInputCardAmounts {
  exchangeAmount: string
  nativeAmount: string
  fiatAmount: string
  fieldChanged: 'fiat' | 'crypto'
}

export interface Props {
  heading?: string
  wallet?: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  startNativeAmount?: string
  keyboardVisible?: boolean
  walletPlaceholderText: string
  forceField?: 'fiat' | 'crypto'
  returnKeyType?: ReturnKeyType
  disabled?: boolean
  inputAccessoryViewID?: string
  onAmountChanged: (amounts: SwapInputCardAmounts) => unknown
  onBlur?: () => void
  onFocus?: () => void
  onMaxPress?: () => void
  onNext?: () => void
  onSelectWallet: () => void
}

const forceFieldMap: { crypto: FieldNum; fiat: FieldNum } = {
  crypto: 0,
  fiat: 1
}

const SwapInputCardComponent = React.forwardRef<SwapInputCardInputRef, Props>((props: Props, ref) => {
  const {
    heading,
    wallet,
    tokenId,
    onBlur,
    onFocus,
    onMaxPress,
    onNext,
    startNativeAmount,
    onAmountChanged,
    walletPlaceholderText,
    returnKeyType,
    forceField = 'crypto',
    keyboardVisible = true,
    disabled,
    inputAccessoryViewID
  } = props

  const exchangeRates = useSelector(state => state.exchangeRates)
  const fiatCurrencyCode = useMaybeFiatCurrencyCode(wallet)
  const flipInputRef = React.useRef<FlipInputRef>(null)

  const cryptoDisplayDenom = useSelector(state => (wallet == null ? emptyEdgeDenomination : selectDisplayDenom(state, wallet.currencyConfig, tokenId)))
  const fiatDenom = getDenomFromIsoCode(fiatCurrencyCode)

  const fieldInfos: FlipInputFieldInfos = [
    { currencyName: cryptoDisplayDenom.name, maxEntryDecimals: log10(cryptoDisplayDenom.multiplier) },
    { currencyName: fiatDenom.name.replace('iso:', ''), maxEntryDecimals: log10(fiatDenom.multiplier) }
  ]

  const convertCurrency = useHandler((amount: string, fromCurrencyCode: string, toCurrencyCode: string): string => {
    const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
    const rate = exchangeRates[rateKey] ?? '0'
    return mul(amount, rate)
  })

  const convertFromCryptoNative = useHandler((nativeAmount: string) => {
    if (wallet == null) return { fiatAmount: '', exchangeAmount: '', displayAmount: '' }
    if (nativeAmount === '') return { fiatAmount: '', exchangeAmount: '', displayAmount: '' }

    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const cryptoExchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    const displayAmount = div(nativeAmount, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)
    const fiatAmountLong = convertCurrency(exchangeAmount, cryptoCurrencyCode, wallet.fiatCurrencyCode)
    const fiatAmount = round(fiatAmountLong, -2)
    return { fiatAmount, exchangeAmount, displayAmount }
  })

  const convertFromFiat = useHandler((fiatAmount: string) => {
    if (wallet == null) return { nativeAmount: '', exchangeAmount: '', displayAmount: '' }
    if (fiatAmount === '') return { nativeAmount: '', exchangeAmount: '', displayAmount: '' }

    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const cryptoExchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
    const exchangeAmountLong = convertCurrency(fiatAmount, wallet.fiatCurrencyCode, cryptoCurrencyCode)
    const nativeAmountLong = mul(exchangeAmountLong, cryptoExchangeDenom.multiplier)
    const displayAmountLong = div(nativeAmountLong, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)

    const precisionAdjustVal = precisionAdjust({
      primaryExchangeMultiplier: cryptoExchangeDenom.multiplier,
      secondaryExchangeMultiplier: fiatDenom.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRates[`${cryptoCurrencyCode}_${fiatCurrencyCode}`]
    })
    const cryptoMaxPrecision = maxPrimaryCurrencyConversionDecimals(log10(cryptoDisplayDenom.multiplier), precisionAdjustVal)

    // Apply cryptoMaxPrecision to remove extraneous sub-penny precision
    const displayAmount = round(displayAmountLong, -cryptoMaxPrecision)

    // Convert back to native and exchange amounts after cryptoMaxPrecision has been applied
    const nativeAmount = mul(displayAmount, cryptoDisplayDenom.multiplier)
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    return { displayAmount, nativeAmount, exchangeAmount }
  })

  const convertValue = useHandler(async (fieldNum: number, amount: string): Promise<string | undefined> => {
    if (amount === '') {
      onAmountChanged({
        exchangeAmount: '',
        nativeAmount: '',
        fiatAmount: '',
        fieldChanged: fieldNum ? 'fiat' : 'crypto'
      })
      return ''
    }
    if (fieldNum === 0) {
      const nativeAmount = mul(amount, cryptoDisplayDenom.multiplier)
      const { fiatAmount, exchangeAmount } = convertFromCryptoNative(nativeAmount)
      onAmountChanged({
        exchangeAmount,
        nativeAmount,
        fiatAmount,
        fieldChanged: 'crypto'
      })

      return fiatAmount
    } else {
      const { nativeAmount, exchangeAmount, displayAmount } = convertFromFiat(amount)
      onAmountChanged({
        exchangeAmount,
        nativeAmount,
        fiatAmount: amount,
        fieldChanged: 'fiat'
      })
      return displayAmount
    }
  })

  const handleWalletPlaceholderPress = () => {
    props.onSelectWallet()
  }

  const { initialExchangeAmount, initialDisplayAmount } = React.useMemo(() => {
    const { exchangeAmount, displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    return { initialExchangeAmount: exchangeAmount, initialDisplayAmount: displayAmount }
  }, [convertFromCryptoNative, startNativeAmount])

  const initialFiatAmount = React.useMemo(() => {
    if (wallet == null) return '0'
    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const fiatAmount = convertCurrency(initialExchangeAmount, cryptoCurrencyCode, wallet.fiatCurrencyCode)
    return fiatAmount
  }, [convertCurrency, initialExchangeAmount, tokenId, wallet])

  React.useImperativeHandle(ref, () => ({
    setAmount: (field, value) => {
      if (field === 'crypto') {
        const { displayAmount, fiatAmount } = convertFromCryptoNative(value)
        flipInputRef.current?.setAmounts([displayAmount, fiatAmount])
      } else if (field === 'fiat') {
        const { displayAmount } = convertFromFiat(value)
        flipInputRef.current?.setAmounts([displayAmount, value])
      }
    }
  }))

  /**
   * Override the 'forceField' prop in some cases.
   * If we set 'forceField' to fiat and we don't yet have exchange rates, ensure
   * that we force the user to input a crypto amount, even if the caller wanted
   * to initialize the focused flip input field with fiat.
   */
  const overrideForceField = useMemo(() => {
    // No wallet has been selected, so we can't get exchange rates yet:
    if (wallet == null) return forceField

    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const fiatValue = convertCurrency('100', cryptoCurrencyCode, wallet.fiatCurrencyCode)
    return fiatValue === '0' ? 'crypto' : forceField
  }, [convertCurrency, forceField, tokenId, wallet])

  const renderHeader = () => {
    return (
      <Header>
        {heading == null ? null : <CardHeading>{heading}</CardHeading>}
        <Space sideways>
          <WalletPlaceHolder onPress={handleWalletPlaceholderPress}>
            {wallet == null ? undefined : (
              <CryptoIconUi4 marginRem={[0, 0.75, 0, 0]} pluginId={wallet.currencyInfo.pluginId} sizeRem={1.75} tokenId={tokenId} />
            )}
            <WalletPlaceHolderText>{walletPlaceholderText}</WalletPlaceHolderText>
          </WalletPlaceHolder>
        </Space>
      </Header>
    )
  }

  return (
    <>
      <FlipInputNew
        disabled={disabled}
        onBlur={onBlur}
        onFocus={onFocus}
        onNext={onNext}
        ref={flipInputRef}
        convertValue={convertValue}
        fieldInfos={fieldInfos}
        renderHeader={renderHeader}
        returnKeyType={returnKeyType}
        forceFieldNum={forceFieldMap[overrideForceField]}
        inputAccessoryViewID={inputAccessoryViewID}
        keyboardVisible={keyboardVisible}
        startAmounts={[initialDisplayAmount, initialFiatAmount]}
        placeholders={[lstrings.string_tap_to_edit, lstrings.string_tap_next_for_quote]}
      />
      {onMaxPress == null ? null : (
        <Space left sideways>
          <ButtonUi4 disabled={disabled} type="tertiary" mini label={lstrings.string_max_cap} marginRem={0} onPress={onMaxPress} />
        </Space>
      )}
    </>
  )
})

export const SwapInputCard = React.memo(SwapInputCardComponent)

const Header = styled(View)(theme => ({
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  padding: theme.rem(0.75)
}))

const CardHeading = styled(EdgeText)(theme => ({
  color: theme.secondaryText
}))

const WalletPlaceHolder = styled(TouchableOpacity)(theme => ({
  alignItems: 'center',
  backgroundColor: theme.cardBaseColor,
  borderRadius: 100,
  flexDirection: 'row',
  paddingHorizontal: theme.rem(0.75),
  paddingVertical: theme.rem(0.5)
}))

const WalletPlaceHolderText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1),
  lineHeight: theme.rem(1.5)
}))

const useMaybeFiatCurrencyCode = (wallet?: EdgeCurrencyWallet): string => {
  const fakeWallet: any = { watch: () => () => {}, fiatCurrencyCode: '' }
  const fiatCurrencyCode = useWatch(wallet ?? fakeWallet, 'fiatCurrencyCode')
  return fiatCurrencyCode
}
