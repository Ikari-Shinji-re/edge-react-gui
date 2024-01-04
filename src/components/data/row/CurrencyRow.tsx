import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { Text } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../../constants/WalletAndCurrencyConstants'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { lstrings } from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { TickerText } from '../../text/TickerText'
import { CryptoIconUi4 } from '../../ui4/CryptoIconUi4'
import { IconDataRow } from './IconDataRow'

interface Props {
  marginRem?: number[] | number
  nativeAmount?: string
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

/**
 * A view representing the data from a wallet, used for rows, cards, etc.
 */
const CurrencyRowComponent = (props: Props) => {
  const { marginRem, nativeAmount, showRate = false, token, tokenId, wallet } = props
  const { pluginId } = wallet.currencyInfo
  const { showTokenNames = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  const theme = useTheme()

  // Currency code for display:
  const allTokens = wallet.currencyConfig.allTokens
  const tokenFromId = token != null ? token : tokenId == null ? null : allTokens[tokenId]
  const { currencyCode } = tokenFromId == null ? wallet.currencyInfo : tokenFromId

  // Wallet name for display:
  let name: React.ReactNode = useWalletName(wallet)
  const compromised = useSelector(state => {
    const { modalShown = 0 } = state.ui?.settings?.securityCheckedWallets?.[wallet.id] ?? {}
    return modalShown > 0
  })
  if (compromised) {
    name = (
      <>
        <Text style={{ color: theme.warningText }}>{lstrings.compromised_key_label}</Text> {name}
      </>
    )
  }

  // Balance stuff:
  const hideBalance = useSelector(state => !state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)
  const icon = <CryptoIconUi4 sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
  const tickerText = showRate && wallet != null ? <TickerText wallet={wallet} tokenId={tokenId} /> : null
  const cryptoText = <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={nativeAmount ?? balance} withSymbol hideBalance={hideBalance} />
  const fiatText = <FiatText nativeCryptoAmount={nativeAmount ?? balance} tokenId={tokenId} wallet={wallet} hideBalance={hideBalance} />

  let displayCurrencyCode = currencyCode
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = `${tokenFromId.displayName}`
  }

  return (
    <IconDataRow
      icon={icon}
      leftText={displayCurrencyCode}
      leftTextExtended={tickerText}
      leftSubtext={name}
      rightText={cryptoText}
      rightSubText={fiatText}
      marginRem={marginRem}
    />
  )
}

export const CurrencyRow = React.memo(CurrencyRowComponent)
