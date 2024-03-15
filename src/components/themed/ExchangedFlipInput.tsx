import { add, div, log10, mul, round } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeTokenId } from 'edge-core-js'
import React, { useMemo, useState } from 'react'
import { ReturnKeyType } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { emptyEdgeDenomination, getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { convertNativeToDenomination, DECIMAL_PRECISION, getDenomFromIsoCode, maxPrimaryCurrencyConversionDecimals, precisionAdjust } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { RowUi4 } from '../ui4/RowUi4'
import { EdgeText } from './EdgeText'
import { FieldNum, FlipInputFieldInfos, FlipInputOld, FlipInputRef } from './FlipInputOld'
export type ExchangeFlipInputFields = 'fiat' | 'crypto'

export interface ExchangedFlipInputRef {
  setAmount: (field: ExchangeFlipInputFields, value: string) => void
}

export interface ExchangedFlipInputAmounts {
  exchangeAmount: string
  nativeAmount: string
  fiatAmount: string
  fieldChanged: 'fiat' | 'crypto'
}

export interface Props {
  wallet?: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  startNativeAmount?: string
  keyboardVisible?: boolean
  headerText: string
  forceField?: 'fiat' | 'crypto'
  returnKeyType?: ReturnKeyType
  displayDenomination: EdgeDenomination
  editable?: boolean
  inputAccessoryViewID?: string
  headerCallback?: () => void
  isFocused?: boolean
  onAmountChanged: (amounts: ExchangedFlipInputAmounts) => unknown
  onBlur?: () => void
  onFocus?: () => void
  onNext?: () => void
  children?: React.ReactNode
}

const forceFieldMap: { crypto: FieldNum; fiat: FieldNum } = {
  crypto: 0,
  fiat: 1
}

// ExchangedFlipInput3 wraps FlipInput2
// 1. It accepts native crypto amounts from the parent for initial amount and setAmount
// 2. Has FlipInput2 only show "display" amounts (ie. sats, bits, mETH)
// 3. Returns values to parent in fiat exchange amt, crypto exchange amt, and crypto native amt

const ExchangedFlipInputComponent = React.forwardRef<ExchangedFlipInputRef, Props>((props: Props, ref) => {
  const {
    wallet,
    tokenId,
    onBlur,
    onFocus,
    onNext,
    startNativeAmount,
    onAmountChanged,
    headerText,
    headerCallback,
    returnKeyType,
    forceField = 'crypto',
    keyboardVisible = true,
    editable,
    inputAccessoryViewID
  } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const exchangeRates = useSelector(state => state.exchangeRates)
  const fiatCurrencyCode = useMaybeFiatCurrencyCode(wallet)
  const flipInputRef = React.useRef<FlipInputRef>(null)

  const cryptoAmount = useMemo(() => {
    if (wallet == null || tokenId === undefined) return
    const balance = wallet.balanceMap.get(tokenId) ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(props.displayDenomination.multiplier)(balance)
    return formatNumber(add(cryptoAmountRaw, '0'))
  }, [props.displayDenomination.multiplier, tokenId, wallet])

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

  const [renderDisplayAmount, setRenderDisplayAmount] = useState<string>(() => {
    const { displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    return displayAmount
  })
  const [renderFiatAmount, setRenderFiatAmount] = useState<string>(() => {
    const { fiatAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    return fiatAmount
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

  React.useEffect(() => {
    if (wallet == null) return

    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const { exchangeAmount, displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    const initFiat = convertCurrency(exchangeAmount, cryptoCurrencyCode, wallet.fiatCurrencyCode)
    setRenderDisplayAmount(displayAmount)
    setRenderFiatAmount(initFiat)
  }, [convertCurrency, convertFromCryptoNative, startNativeAmount, tokenId, wallet])

  React.useImperativeHandle(ref, () => ({
    setAmount: (field, value) => {
      console.log(field, value)
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

  return (
    <>
      {cryptoAmount == null ? null : (
        <EdgeText style={styles.balanceText}>{lstrings.string_wallet_balance + ': ' + cryptoAmount + ' ' + props.displayDenomination.name}</EdgeText>
      )}
      <CardUi4>
        <RowUi4
          onPress={headerCallback}
          icon={
            wallet == null ? undefined : <CryptoIconUi4 marginRem={[0, 0.5, 0, 0]} pluginId={wallet.currencyInfo.pluginId} sizeRem={1.5} tokenId={tokenId} />
          }
        >
          <EdgeText style={styles.headerText}>{headerText}</EdgeText>
        </RowUi4>

        {!props.isFocused ? null : (
          <>
            <FlipInputOld
              onBlur={onBlur}
              onFocus={onFocus}
              onNext={onNext}
              ref={flipInputRef}
              convertValue={convertValue}
              editable={editable}
              fieldInfos={fieldInfos}
              returnKeyType={returnKeyType}
              forceFieldNum={forceFieldMap[overrideForceField]}
              inputAccessoryViewID={inputAccessoryViewID}
              keyboardVisible={keyboardVisible}
              startAmounts={[renderDisplayAmount ?? '', renderFiatAmount]}
            />
            {props.children}
          </>
        )}
      </CardUi4>
    </>
  )
})

export const ExchangedFlipInput = React.memo(ExchangedFlipInputComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  balanceText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    color: theme.secondaryText
  },
  headerText: {
    fontWeight: '600',
    fontSize: theme.rem(1.0)
  }
}))

const useMaybeFiatCurrencyCode = (wallet?: EdgeCurrencyWallet): string => {
  const fakeWallet: any = { watch: () => () => {}, fiatCurrencyCode: '' }
  const fiatCurrencyCode = useWatch(wallet ?? fakeWallet, 'fiatCurrencyCode')
  return fiatCurrencyCode
}
