import { add } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { useMemo } from 'react'

import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { convertNativeToDenomination } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { EdgeText } from './EdgeText'
import { ExchangedFlipInput, ExchangedFlipInputAmounts } from './ExchangedFlipInput'

interface Props {
  wallet?: EdgeCurrencyWallet
  buttonText: string
  headerText: string
  tokenId: EdgeTokenId
  displayDenomination: EdgeDenomination
  overridePrimaryNativeAmount: string
  isFocused: boolean
  onFocusWallet: () => void
  onSelectWallet: () => void
  onAmountChanged: (amounts: ExchangedFlipInputAmounts) => void
  onNext: () => void
  onFocus?: () => void
  onBlur?: () => void
  children?: React.ReactNode
}

export const SwapFlipInput = (props: Props) => {
  const { children, tokenId, displayDenomination, onNext, overridePrimaryNativeAmount, wallet } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  //
  // Derived State
  //

  const cryptoAmount = useMemo(() => {
    if (wallet == null || tokenId === undefined) return
    const balance = wallet.balanceMap.get(tokenId) ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(displayDenomination.multiplier)(balance)
    return formatNumber(add(cryptoAmountRaw, '0'))
  }, [displayDenomination.multiplier, tokenId, wallet])

  //
  // Handlers
  //

  const handleAmountsChanged = (amounts: ExchangedFlipInputAmounts) => {
    props.onAmountChanged(amounts)
  }

  const launchSelector = () => {
    if (props.isFocused || wallet == null) {
      props.onSelectWallet()
    } else {
      props.onFocusWallet()
    }
  }

  //
  // Render
  //

  return (
    <>
      {cryptoAmount == null ? null : (
        <EdgeText style={styles.balanceText}>{lstrings.string_wallet_balance + ': ' + cryptoAmount + ' ' + displayDenomination.name}</EdgeText>
      )}
      <CardUi4>
        <ExchangedFlipInput
          onNext={onNext}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          headerText={wallet == null ? props.buttonText : props.headerText}
          headerCallback={launchSelector}
          onAmountChanged={handleAmountsChanged}
          startNativeAmount={overridePrimaryNativeAmount}
          keyboardVisible={false}
          forceField="fiat"
          tokenId={tokenId}
          wallet={wallet}
          isFocused={props.isFocused}
        />
        {children}
      </CardUi4>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  balanceText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    color: theme.secondaryText
  }
}))
