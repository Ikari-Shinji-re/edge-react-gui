import { EdgeCurrencyWallet, EdgeDenomination, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

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
      <ExchangedFlipInput
        onNext={onNext}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        headerText={wallet == null ? props.buttonText : props.headerText}
        headerCallback={launchSelector}
        displayDenomination={displayDenomination}
        onAmountChanged={handleAmountsChanged}
        startNativeAmount={overridePrimaryNativeAmount}
        keyboardVisible={false}
        forceField="fiat"
        tokenId={tokenId}
        wallet={wallet}
        isFocused={props.isFocused}
      >
        {children}
      </ExchangedFlipInput>
    </>
  )
}
