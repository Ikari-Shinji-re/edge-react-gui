import { convertCurrency } from '../selectors/WalletSelectors'
import { ThunkAction } from '../types/reduxTypes'
import { AccountReferral } from '../types/ReferralTypes'
import { getHistoricalRate } from '../util/exchangeRates'
import { logEvent, TrackingEventName, TrackingValues } from '../util/tracking'

/**
 * Tracks a conversion, which involves some of revenue.
 */
export function trackConversion(
  event: TrackingEventName,
  opts: {
    currencyCode: string
    exchangeAmount: number
    pluginId: string
    orderId?: string
  }
): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { currencyCode, exchangeAmount, pluginId, orderId } = opts

    // Look up the dollar value:
    const dollarValue: number = parseFloat(convertCurrency(state, currencyCode, 'iso:USD', String(exchangeAmount)))

    // Record the event:
    const { accountReferral } = state.account
    return logEvent(event, {
      dollarValue,
      pluginId,
      orderId,
      ...makeTrackingValues(accountReferral)
    })
  }
}

export async function trackConversionWithReferral(
  event: TrackingEventName,
  opts: {
    destCurrencyCode: string
    destExchangeAmount: string
    destPluginId?: string
    sourceCurrencyCode: string
    sourceExchangeAmount: string
    sourcePluginId?: string
    orderId?: string
    pluginId: string
  },
  accountReferral: AccountReferral
): Promise<void> {
  const { destCurrencyCode, destExchangeAmount, destPluginId, pluginId, sourceCurrencyCode, sourceExchangeAmount, sourcePluginId, orderId } = opts

  // Look up the dollar value:
  const rate = await getHistoricalRate(`${destCurrencyCode}_iso:USD`, new Date().toISOString())
  const dollarValue = Number(destExchangeAmount) * rate

  // Record the event:
  logEvent(event, {
    dollarValue,
    pluginId,
    orderId,
    destCurrencyCode,
    destExchangeAmount,
    destPluginId,
    sourceCurrencyCode,
    sourceExchangeAmount,
    sourcePluginId,
    ...makeTrackingValues(accountReferral)
  })
}

/**
 * Tracks an event tied to a particular account's affiliate information,
 * such as creating the initial wallets.
 */
export function trackAccountEvent(event: TrackingEventName, trackingValues: TrackingValues = {}): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()

    // Record the event:
    const { accountReferral } = state.account
    logEvent(event, {
      ...trackingValues,
      ...makeTrackingValues(accountReferral)
    })
  }
}

/**
 * Turn account affiliate information into clean tracking values.
 * Obfuscates the creation date so the server can't guess account identities.
 */
function makeTrackingValues(accountReferral: AccountReferral): TrackingValues {
  const { creationDate, installerId } = accountReferral
  if (installerId == null || creationDate == null) return {}
  return {
    accountDate: creationDate.toISOString().replace(/-\d\dT.*/, ''),
    installerId
  }
}
