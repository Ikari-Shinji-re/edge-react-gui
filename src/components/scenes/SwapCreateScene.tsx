import { add, gt, gte } from 'biggystring'
import { EdgeCurrencyWallet, EdgeSwapRequest, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { Keyboard } from 'react-native'
import { sprintf } from 'sprintf-js'

import { DisableAsset } from '../../actions/ExchangeInfoActions'
import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDenomination, zeroString } from '../../util/utils'
import { EdgeAnim, fadeInDown30, fadeInDown60, fadeInDown90, fadeInUp60, fadeInUp90 } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SwapVerticalIcon } from '../icons/ThemedIcons'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError, showWarning } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SceneHeader } from '../themed/SceneHeader'
import { SwapInputCard } from '../themed/SwapInputCard'
import { ButtonBox } from '../themed/ThemedButtons'
import { AlertCardUi4 } from '../ui4/AlertCardUi4'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'

export interface SwapCreateParams {
  // The following props are used to populate the flip inputs
  fromWalletId?: string | undefined
  fromTokenId?: EdgeTokenId
  toWalletId?: string | undefined
  toTokenId?: EdgeTokenId

  // Display error message in an alert card
  errorDisplayInfo?: SwapErrorDisplayInfo
}

export interface SwapErrorDisplayInfo {
  message: string
  title: string
}

interface Props extends EdgeSceneProps<'swapCreate'> {}

interface State {
  nativeAmount: string
  nativeAmountFor: 'from' | 'to'
}

const defaultState: State = {
  nativeAmount: '',
  nativeAmountFor: 'from'
}

const emptyDenomnination = {
  name: '',
  multiplier: '1'
}

export const SwapCreateScene = (props: Props) => {
  const { navigation, route } = props
  const { fromWalletId, fromTokenId = null, toWalletId, toTokenId = null, errorDisplayInfo } = route.params ?? {}
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const [state, setState] = useState({
    ...defaultState
  })

  const fromInputRef = React.useRef<ExchangedFlipInputRef>(null)
  const toInputRef = React.useRef<ExchangedFlipInputRef>(null)

  const swapRequestOptions = useSwapRequestOptions()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const exchangeInfo = useSelector(state => state.ui.exchangeInfo)

  const toWallet: EdgeCurrencyWallet | undefined = toWalletId == null ? undefined : currencyWallets[toWalletId]
  const fromWallet: EdgeCurrencyWallet | undefined = fromWalletId == null ? undefined : currencyWallets[fromWalletId]

  const toWalletName = toWallet == null ? '' : getWalletName(toWallet)
  const fromWalletName = fromWallet == null ? '' : getWalletName(fromWallet)
  const fromCurrencyCode = fromWallet == null ? '' : getCurrencyCode(fromWallet, fromTokenId)
  const toCurrencyCode = toWallet == null ? '' : getCurrencyCode(toWallet, toTokenId)

  const fromWalletDisplayDenomination = useSelector(state =>
    fromWallet == null ? emptyDenomnination : selectDisplayDenom(state, fromWallet.currencyConfig, fromTokenId)
  )
  const fromWalletSpecialCurrencyInfo = getSpecialCurrencyInfo(fromWallet?.currencyInfo.pluginId ?? '')
  const fromWalletBalanceMap = fromWallet?.balanceMap ?? new Map<string, string>()

  const fromHeaderText = fromWallet == null ? lstrings.select_src_wallet : fromWalletName
  const toHeaderText = toWallet == null ? lstrings.select_recv_wallet : toWalletName
  // Determines if a coin can have Exchange Max option
  const hasMaxSpend = fromWalletSpecialCurrencyInfo.noMaxSpend !== true

  //
  // Callbacks
  //

  const checkDisableAsset = (disableAssets: DisableAsset[], walletId: string, tokenId: EdgeTokenId): boolean => {
    const wallet = currencyWallets[walletId] ?? { currencyInfo: {} }
    const walletPluginId = wallet.currencyInfo.pluginId
    const walletTokenId = tokenId
    for (const disableAsset of disableAssets) {
      const { pluginId, tokenId } = disableAsset
      if (pluginId !== walletPluginId) continue
      if (tokenId === walletTokenId) return true
      if (tokenId === 'allCoins') return true
      if (tokenId === 'allTokens' && walletTokenId != null) return true
    }
    return false
  }

  const checkExceedsAmount = (): boolean => {
    const fromNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    return state.nativeAmountFor === 'from' && gte(fromNativeBalance, '0') && gt(state.nativeAmount, fromNativeBalance)
  }

  const getQuote = (swapRequest: EdgeSwapRequest) => {
    if (exchangeInfo != null) {
      const disableSrc = checkDisableAsset(exchangeInfo.swap.disableAssets.source, swapRequest.fromWallet.id, fromTokenId)
      if (disableSrc) {
        showError(sprintf(lstrings.exchange_asset_unsupported, fromCurrencyCode))
        return
      }

      const disableDest = checkDisableAsset(exchangeInfo.swap.disableAssets.destination, swapRequest.toWallet.id, toTokenId)
      if (disableDest) {
        showError(sprintf(lstrings.exchange_asset_unsupported, toCurrencyCode))
        return
      }
    }
    // Clear the error state:
    navigation.setParams({
      ...route.params,
      errorDisplayInfo: undefined
    })

    // Start request for quote:
    navigation.navigate('swapProcessing', {
      swapRequest,
      swapRequestOptions,
      onCancel: () => {
        navigation.goBack()
      },
      onDone: quotes => {
        navigation.replace('swapConfirmation', {
          selectedQuote: quotes[0],
          quotes,
          onApprove: resetState
        })
      }
    })
    Keyboard.dismiss()
  }

  const resetState = () => {
    setState(defaultState)
  }

  const showWalletListModal = (whichWallet: 'from' | 'to') => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={props.navigation}
        headerTitle={whichWallet === 'to' ? lstrings.select_recv_wallet : lstrings.select_src_wallet}
        showCreateWallet={whichWallet === 'to'}
        allowKeysOnlyMode={whichWallet === 'from'}
        filterActivation
      />
    ))
      .then(async result => {
        if (result?.type === 'wallet') {
          const { walletId, tokenId } = result
          await handleSelectWallet(walletId, tokenId, whichWallet)
        }
      })
      .catch(error => showError(error))
  }

  //
  // Handlers
  //

  const handleFlipWalletPress = useHandler(() => {
    // Flip params:
    navigation.setParams({
      fromWalletId: toWalletId,
      fromTokenId: toTokenId,
      toWalletId: fromWalletId,
      toTokenId: fromTokenId,
      errorDisplayInfo
    })
    // Clear amount input state:
    setState({
      ...state,
      nativeAmount: '0'
    })
    // Clear all input amounts:
    toInputRef.current?.setAmount('crypto', '0')
    fromInputRef.current?.setAmount('crypto', '0')
  })

  const handleSelectWallet = useHandler(async (walletId: string, tokenId: EdgeTokenId, direction: 'from' | 'to') => {
    const params = {
      ...route.params,
      ...(direction === 'to'
        ? {
            toWalletId: walletId,
            toTokenId: tokenId
          }
        : {
            fromWalletId: walletId,
            fromTokenId: tokenId
          })
    }
    navigation.setParams(params)
    dispatch(updateMostRecentWalletsSelected(walletId, tokenId))
  })

  const handleMaxPress = useHandler(() => {
    if (toWallet == null) {
      showWarning(`${lstrings.exchange_select_receiving_wallet}`)
      Keyboard.dismiss()
      return
    }

    if (fromWallet == null) {
      // Shouldn't ever happen because max button UI is disabled when no
      // fromWallet is selected
      showWarning(`${lstrings.exchange_select_sending_wallet}`)
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId: fromTokenId,
      fromWallet: fromWallet,
      nativeAmount: '0',
      quoteFor: 'max',
      toTokenId: toTokenId,
      toWallet: toWallet
    }

    getQuote(request)
  })

  const handleNext = useHandler(() => {
    // Should only happen if the user initiated the swap from the keyboard
    if (fromWallet == null || toWallet == null) return

    if (zeroString(state.nativeAmount)) {
      showError(`${lstrings.no_exchange_amount}. ${lstrings.select_exchange_amount}.`)
      return
    }

    const request: EdgeSwapRequest = {
      fromTokenId: fromTokenId,
      fromWallet: fromWallet,
      nativeAmount: state.nativeAmount,
      quoteFor: state.nativeAmountFor,
      toTokenId: toTokenId,
      toWallet: toWallet
    }

    if (checkExceedsAmount()) return

    getQuote(request)
  })

  const handleFromSelectWallet = useHandler(() => {
    showWalletListModal('from')
  })

  const handleToSelectWallet = useHandler(() => {
    showWalletListModal('to')
  })

  const handleFromAmountChange = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      nativeAmount: amounts.nativeAmount,
      nativeAmountFor: 'from'
    })
    // Clear other input's amount:
    toInputRef.current?.setAmount('crypto', '0')
  })

  const handleToAmountChange = useHandler((amounts: ExchangedFlipInputAmounts) => {
    setState({
      ...state,
      nativeAmount: amounts.nativeAmount,
      nativeAmountFor: 'to'
    })
    // Clear other input's amount:
    fromInputRef.current?.setAmount('crypto', '0')
  })

  //
  // Render
  //

  const renderButton = () => {
    const showNext = fromCurrencyCode !== '' && toCurrencyCode !== '' && !!parseFloat(state.nativeAmount)
    if (!showNext) return null
    if (checkExceedsAmount()) return null
    return <ButtonsViewUi4 primary={{ label: lstrings.string_next_capitalized, onPress: handleNext }} parentType="scene" />
  }

  const renderAlert = () => {
    const { minimumPopupModals } = fromWalletSpecialCurrencyInfo
    const primaryNativeBalance = fromWalletBalanceMap.get(fromTokenId) ?? '0'

    if (minimumPopupModals != null && primaryNativeBalance < minimumPopupModals.minimumNativeBalance) {
      return <AlertCardUi4 title={lstrings.request_minimum_notification_title} body={minimumPopupModals.alertMessage} type="warning" />
    }

    if (errorDisplayInfo != null) {
      return <AlertCardUi4 title={errorDisplayInfo.title} body={errorDisplayInfo.message} type="error" />
    }

    if (checkExceedsAmount()) {
      return <AlertCardUi4 title={lstrings.exchange_insufficient_funds_title} body={lstrings.exchange_insufficient_funds_below_balance} type="error" />
    }

    return null
  }

  const fromWalletBalanceText: string = useMemo(() => {
    if (fromWallet == null || fromTokenId === undefined) return ''
    const balance = fromWallet.balanceMap.get(fromTokenId) ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(fromWalletDisplayDenomination.multiplier)(balance)
    const fromCryptoBalance = formatNumber(add(cryptoAmountRaw, '0'))

    return fromCryptoBalance + ' ' + fromWalletDisplayDenomination.name
  }, [fromTokenId, fromWallet, fromWalletDisplayDenomination.multiplier, fromWalletDisplayDenomination.name])

  return (
    <SceneWrapper hasTabs hasNotifications scroll keyboardShouldPersistTaps="handled" padding={theme.rem(0.5)}>
      <EdgeAnim style={styles.header} enter={fadeInUp90}>
        <SceneHeader title={lstrings.title_exchange} underline />
      </EdgeAnim>
      <EdgeAnim enter={fadeInUp60}>
        <SwapInputCard
          ref={fromInputRef}
          heading={sprintf(lstrings.exchange_title_sending_s, fromWalletBalanceText)}
          disabled={fromWallet == null}
          forceField="fiat"
          walletPlaceholderText={fromHeaderText}
          keyboardVisible={false}
          onAmountChanged={handleFromAmountChange}
          onNext={handleNext}
          onSelectWallet={handleFromSelectWallet}
          tokenId={fromTokenId}
          wallet={fromWallet}
          onMaxPress={hasMaxSpend ? handleMaxPress : undefined}
        />
      </EdgeAnim>
      <EdgeAnim>
        <LineTextDivider lowerCased>
          <ButtonBox onPress={handleFlipWalletPress}>
            <SwapVerticalIcon color={theme.iconTappable} size={theme.rem(2)} />
          </ButtonBox>
        </LineTextDivider>
      </EdgeAnim>
      <EdgeAnim enter={fadeInDown30}>
        <SwapInputCard
          ref={toInputRef}
          disabled={toWallet == null}
          forceField="fiat"
          walletPlaceholderText={toHeaderText}
          keyboardVisible={false}
          onAmountChanged={handleToAmountChange}
          onNext={handleNext}
          onSelectWallet={handleToSelectWallet}
          tokenId={toTokenId}
          wallet={toWallet}
          heading={lstrings.exchange_title_receiving}
        />
      </EdgeAnim>
      <EdgeAnim enter={fadeInDown60}>{renderAlert()}</EdgeAnim>
      <EdgeAnim enter={fadeInDown90}>{renderButton()}</EdgeAnim>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    marginLeft: -theme.rem(0.5),
    width: '100%',
    marginVertical: theme.rem(1)
  }
}))
