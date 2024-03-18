import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native'
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'
import { AirshipToast } from 'react-native-airship'

import { getDeviceSettings } from '../actions/DeviceSettingsActions'
import { logoutRequest } from '../actions/LoginActions'
import { checkEnabledExchanges, showReEnableOtpModal } from '../actions/SettingsActions'
import { HomeSceneUi4 } from '../components/ui4/scenes/HomeSceneUi4'
import { ENV } from '../env'
import { DEFAULT_EXPERIMENT_CONFIG, ExperimentConfig, getExperimentConfig } from '../experimentConfig'
import { useAsyncEffect } from '../hooks/useAsyncEffect'
import { useMount } from '../hooks/useMount'
import { lstrings } from '../locales/strings'
import { AddressFormScene } from '../plugins/gui/scenes/AddressFormScene'
import { FiatPluginEnterAmountScene } from '../plugins/gui/scenes/FiatPluginEnterAmountScene'
import { FiatPluginWebViewComponent } from '../plugins/gui/scenes/FiatPluginWebView'
import { InfoDisplayScene } from '../plugins/gui/scenes/InfoDisplayScene'
import { RewardsCardDashboardScene } from '../plugins/gui/scenes/RewardsCardDashboardScene'
import { RewardsCardWelcomeScene } from '../plugins/gui/scenes/RewardsCardWelcomeScene'
import { SepaFormScene } from '../plugins/gui/scenes/SepaFormScene'
import { defaultAccount } from '../reducers/CoreReducer'
import { useDispatch, useSelector } from '../types/reactRedux'
import { AppParamList, NavigationBase } from '../types/routerTypes'
import { isMaestro } from '../util/maestro'
import { logEvent } from '../util/tracking'
import { useBackEvent } from './hoc/useBackEvent'
import { BackButton } from './navigation/BackButton'
import { CurrencySettingsTitle } from './navigation/CurrencySettingsTitle'
import { EdgeHeader } from './navigation/EdgeHeader'
import { PluginBackButton } from './navigation/GuiPluginBackButton'
import { HeaderBackground } from './navigation/HeaderBackground'
import { HeaderTextButton } from './navigation/HeaderTextButton'
import { ParamHeaderTitle } from './navigation/ParamHeaderTitle'
import { SideMenuButton } from './navigation/SideMenuButton'
import { TransactionDetailsTitle } from './navigation/TransactionDetailsTitle'
import { LoadingSplashScreen } from './progress-indicators/LoadingSplashScreen'
import { AssetSettingsScene } from './scenes/AssetSettingsScene'
import { ChangeMiningFeeScene } from './scenes/ChangeMiningFeeScene'
import { ChangePasswordScene } from './scenes/ChangePasswordScene'
import { ChangePinScene } from './scenes/ChangePinScene'
import { CoinRankingDetailsScene } from './scenes/CoinRankingDetailsScene'
import { CoinRankingScene } from './scenes/CoinRankingScene'
import { ConfirmScene } from './scenes/ConfirmScene'
import { CreateWalletAccountSelectScene } from './scenes/CreateWalletAccountSelectScene'
import { CreateWalletAccountSetupScene } from './scenes/CreateWalletAccountSetupScene'
import { CreateWalletCompletionScene } from './scenes/CreateWalletCompletionScene'
import { CreateWalletImportOptionsScene } from './scenes/CreateWalletImportOptionsScene'
import { CreateWalletImportScene } from './scenes/CreateWalletImportScene'
import { CreateWalletSelectCryptoScene } from './scenes/CreateWalletSelectCryptoScene'
import { CreateWalletSelectFiatScene } from './scenes/CreateWalletSelectFiatScene'
import { CurrencyNotificationScene } from './scenes/CurrencyNotificationScene'
import { CurrencySettingsScene } from './scenes/CurrencySettingsScene'
import { DefaultFiatSettingScene } from './scenes/DefaultFiatSettingScene'
import { DevTestScene } from './scenes/DevTestScene'
import { EdgeLoginScene } from './scenes/EdgeLoginScene'
import { EditTokenScene } from './scenes/EditTokenScene'
import { ExtraTabScene } from './scenes/ExtraTabScene'
import { FioAddressDetailsScene } from './scenes/Fio/FioAddressDetailsScene'
import { FioAddressListScene } from './scenes/Fio/FioAddressListScene'
import { FioAddressRegisteredScene } from './scenes/Fio/FioAddressRegisteredScene'
import { FioAddressRegisterScene } from './scenes/Fio/FioAddressRegisterScene'
import { FioAddressRegisterSelectWalletScene } from './scenes/Fio/FioAddressRegisterSelectWalletScene'
import { FioAddressSettingsScene } from './scenes/Fio/FioAddressSettingsScene'
import { FioConnectWalletConfirmScene } from './scenes/Fio/FioConnectWalletConfirmScene'
import { FioCreateHandleScene } from './scenes/Fio/FioCreateHandleScene'
import { FioDomainRegisterScene } from './scenes/Fio/FioDomainRegisterScene'
import { FioDomainRegisterSelectWalletScene } from './scenes/Fio/FioDomainRegisterSelectWalletScene'
import { FioDomainSettingsScene } from './scenes/Fio/FioDomainSettingsScene'
import { FioNameConfirmScene } from './scenes/Fio/FioNameConfirmScene'
import { FioRequestConfirmationScene } from './scenes/Fio/FioRequestConfirmationScene'
import { FioRequestListScene } from './scenes/Fio/FioRequestListScene'
import { FioSentRequestDetailsScene } from './scenes/Fio/FioSentRequestDetailsScene'
import { FioStakingChangeScene } from './scenes/Fio/FioStakingChangeScene'
import { FioStakingOverviewScene } from './scenes/Fio/FioStakingOverviewScene'
import { GettingStartedScene } from './scenes/GettingStartedScene'
import { GuiPluginListScene } from './scenes/GuiPluginListScene'
import { GuiPluginViewScene } from './scenes/GuiPluginViewScene'
import { LoanCloseScene } from './scenes/Loans/LoanCloseScene'
import { LoanCreateConfirmationScene } from './scenes/Loans/LoanCreateConfirmationScene'
import { LoanCreateScene } from './scenes/Loans/LoanCreateScene'
import { LoanDashboardScene } from './scenes/Loans/LoanDashboardScene'
import { LoanDetailsScene } from './scenes/Loans/LoanDetailsScene'
import { LoanManageScene } from './scenes/Loans/LoanManageScene'
import { LoanStatusScene } from './scenes/Loans/LoanStatusScene'
import { LoginScene } from './scenes/LoginScene'
import { ManageTokensScene } from './scenes/ManageTokensScene'
import { MigrateWalletCalculateFeeScene } from './scenes/MigrateWalletCalculateFeeScene'
import { MigrateWalletCompletionScene } from './scenes/MigrateWalletCompletionScene'
import { MigrateWalletSelectCryptoScene } from './scenes/MigrateWalletSelectCryptoScene'
import { NotificationScene } from './scenes/NotificationScene'
import { OtpRepairScene } from './scenes/OtpRepairScene'
import { OtpSettingsScene } from './scenes/OtpSettingsScene'
import { ChangeRecoveryScene } from './scenes/PasswordRecoveryScene'
import { PromotionSettingsScene } from './scenes/PromotionSettingsScene'
import { RequestScene } from './scenes/RequestScene'
import { SecurityAlertsScene } from './scenes/SecurityAlertsScene'
import { SendScene2 } from './scenes/SendScene2'
import { SettingsScene } from './scenes/SettingsScene'
import { SpendingLimitsScene } from './scenes/SpendingLimitsScene'
import { StakeModifyScene } from './scenes/Staking/StakeModifyScene'
import { StakeOptionsScene } from './scenes/Staking/StakeOptionsScene'
import { StakeOverviewScene } from './scenes/Staking/StakeOverviewScene'
import { SwapConfirmationScene } from './scenes/SwapConfirmationScene'
import { SwapCreateScene } from './scenes/SwapCreateScene'
import { SwapProcessingScene } from './scenes/SwapProcessingScene'
import { SwapSettingsScene } from './scenes/SwapSettingsScene'
import { SwapSuccessScene } from './scenes/SwapSuccessScene'
import { TransactionDetailsScene } from './scenes/TransactionDetailsScene'
import { TransactionList } from './scenes/TransactionListScene'
import { TransactionsExportScene } from './scenes/TransactionsExportScene'
import { UpgradeUsernameScene } from './scenes/UpgradeUsernameScreen'
import { WalletListScene } from './scenes/WalletListScene'
import { WcConnectionsScene } from './scenes/WcConnectionsScene'
import { WcConnectScene } from './scenes/WcConnectScene'
import { WcDisconnectScene } from './scenes/WcDisconnectScene'
import { WebViewScene } from './scenes/WebViewScene'
import { Airship, showError } from './services/AirshipInstance'
import { useTheme } from './services/ThemeContext'
import { MenuTabs } from './themed/MenuTabs'
import { SideMenu } from './themed/SideMenu'

const Drawer = createDrawerNavigator<AppParamList>()
const Stack = createStackNavigator<AppParamList>()
const Tab = createBottomTabNavigator<AppParamList>()

const headerMode = isMaestro() && Platform.OS === 'android' ? 'float' : undefined

const defaultScreenOptions: StackNavigationOptions = {
  title: '',
  headerTitle: EdgeHeader,
  headerLeft: () => <BackButton />,
  headerRight: () => <SideMenuButton />,
  headerShown: true,
  headerMode,
  headerTitleAlign: 'center',
  headerBackground: HeaderBackground,
  headerTransparent: true
}
const firstSceneScreenOptions: StackNavigationOptions = {
  headerLeft: () => <HeaderTextButton type="help" />,
  headerTitle: EdgeHeader,
  headerTitleAlign: 'center'
}

export const Main = () => {
  const theme = useTheme()
  const dispatch = useDispatch()

  // TODO: Create a new provider instead to serve the experimentConfig globally
  const [experimentConfig, setExperimentConfig] = React.useState<ExperimentConfig | undefined>(isMaestro() ? DEFAULT_EXPERIMENT_CONFIG : undefined)

  const [hasInitialScenesLoaded, setHasInitialScenesLoaded] = React.useState(false)

  // Match react navigation theme background with the patina theme
  const reactNavigationTheme = React.useMemo(() => {
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.backgroundGradientColors[0]
      }
    }
  }, [theme])

  const localUsers = useSelector(state => state.core.context.localUsers)

  useMount(() => {
    dispatch(logEvent('Start_App', { numAccounts: localUsers.length }))
    if (localUsers.length === 0) {
      dispatch(logEvent('Start_App_No_Accounts'))
    } else {
      dispatch(logEvent('Start_App_With_Accounts'))
    }

    // Used to re-enable animations to login scene:
    setTimeout(() => {
      setHasInitialScenesLoaded(true)
    }, 0)
  })

  // Wait for the experiment config to initialize before rendering anything
  useAsyncEffect(
    async () => {
      if (isMaestro()) return
      setExperimentConfig(await getExperimentConfig())
    },
    [],
    'setLegacyLanding'
  )

  return (
    <>
      {experimentConfig == null ? (
        <LoadingSplashScreen />
      ) : (
        <NavigationContainer theme={reactNavigationTheme}>
          <Stack.Navigator
            initialRouteName={ENV.USE_WELCOME_SCREENS && experimentConfig.landingType !== 'A_legacy' ? 'gettingStarted' : 'login'}
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen name="edgeApp" component={EdgeApp} />
            <Stack.Screen name="gettingStarted" component={GettingStartedScene} initialParams={{ experimentConfig }} />
            <Stack.Screen name="login" component={LoginScene} initialParams={{ experimentConfig }} options={{ animationEnabled: hasInitialScenesLoaded }} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </>
  )
}

const EdgeApp = () => {
  const backPressedOnce = React.useRef(false)
  const account = useSelector(state => state.core.account)
  const dispatch = useDispatch()
  const navigation = useNavigation<NavigationBase>()

  useBackEvent(() => {
    // Allow back if logged out or this is the second back press
    if (account === defaultAccount || backPressedOnce.current) {
      dispatch(logoutRequest(navigation)).catch(err => showError(err))
      return true
    }
    backPressedOnce.current = true
    Airship.show(bridge => <AirshipToast bridge={bridge} message={lstrings.back_button_tap_again_to_exit} />)
      .then(() => {
        backPressedOnce.current = false
      })
      .catch(err => showError(err))
    // Timeout the back press after 3 seconds so the state isn't "sticky"
    setTimeout(() => {
      backPressedOnce.current = false
    }, 3000)
    return false
  })

  return (
    <Drawer.Navigator
      drawerContent={props => SideMenu(props)}
      initialRouteName="edgeAppStack"
      screenOptions={{
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: { backgroundColor: 'transparent', bottom: 0 },
        headerShown: false
      }}
    >
      <Drawer.Screen name="edgeAppStack" component={EdgeAppStack} />
    </Drawer.Navigator>
  )
}

const EdgeAppStack = () => {
  const dispatch = useDispatch()

  return (
    <Stack.Navigator initialRouteName="edgeTabs" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="edgeTabs"
        component={EdgeTabs}
        options={{
          headerShown: false
        }}
      />

      <Stack.Screen
        name="changeMiningFee2"
        component={ChangeMiningFeeScene}
        options={{
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="changePassword"
        component={ChangePasswordScene}
        options={{
          title: lstrings.title_change_password,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="changePin"
        component={ChangePinScene}
        options={{
          title: lstrings.title_change_pin,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="coinRanking"
        component={CoinRankingScene}
        listeners={{
          focus: () => dispatch(checkEnabledExchanges())
        }}
      />
      <Stack.Screen name="coinRankingDetails" component={CoinRankingDetailsScene} />
      <Stack.Screen name="confirmScene" component={ConfirmScene} />
      <Stack.Screen
        name="createWalletAccountSelect"
        component={CreateWalletAccountSelectScene}
        options={{
          title: lstrings.create_wallet_account_activate,
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="createWalletAccountSetup"
        component={CreateWalletAccountSetupScene}
        options={{
          title: lstrings.create_wallet_create_account,
          headerRight: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen
        name="createWalletCompletion"
        component={CreateWalletCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="createWalletImport"
        component={CreateWalletImportScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="createWalletImportOptions"
        component={CreateWalletImportOptionsScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="createWalletSelectCrypto" component={CreateWalletSelectCryptoScene} />
      <Stack.Screen
        name="createWalletSelectCryptoNewAccount"
        component={CreateWalletSelectCryptoScene}
        options={{
          headerRight: () => null,
          headerLeft: () => null
        }}
      />
      <Stack.Screen name="createWalletSelectFiat" component={CreateWalletSelectFiatScene} />
      <Stack.Screen
        name="currencyNotificationSettings"
        component={CurrencyNotificationScene}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="assetSettings"
        component={AssetSettingsScene}
        options={{
          title: lstrings.settings_asset_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="currencySettings"
        component={CurrencySettingsScene}
        options={{
          headerTitle: props => <CurrencySettingsTitle />,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="defaultFiatSetting"
        component={DefaultFiatSettingScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="edgeLogin" component={EdgeLoginScene} />
      <Stack.Screen
        name="editToken"
        component={EditTokenScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="swapSettings"
        component={SwapSettingsScene}
        options={{
          title: lstrings.settings_exchange_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="swapSuccess"
        component={SwapSuccessScene}
        options={{
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="extraTab"
        component={ExtraTabScene}
        options={{
          headerLeft: () => <HeaderTextButton type="help" />
        }}
      />
      <Stack.Screen name="fioAddressDetails" component={FioAddressDetailsScene} />
      <Stack.Screen name="fioAddressList" component={FioAddressListScene} />
      <Stack.Screen name="fioAddressRegister" component={FioAddressRegisterScene} />
      <Stack.Screen
        name="fioAddressRegisterSelectWallet"
        component={FioAddressRegisterSelectWalletScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="fioAddressRegisterSuccess"
        component={FioAddressRegisteredScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'fioAddressRegisterSuccess'> fromParams={params => params.fioName} />,
          headerLeft: () => null
        }}
      />
      <Stack.Screen name="fioAddressSettings" component={FioAddressSettingsScene} />
      <Stack.Screen name="fioConnectToWalletsConfirm" component={FioConnectWalletConfirmScene} />
      <Stack.Screen
        name="fioCreateHandle"
        component={FioCreateHandleScene}
        options={{
          title: lstrings.fio_free_handle_title
        }}
      />
      <Stack.Screen
        name="fioDomainConfirm"
        component={FioNameConfirmScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="fioDomainRegister" component={FioDomainRegisterScene} />
      <Stack.Screen
        name="fioDomainRegisterSelectWallet"
        component={FioDomainRegisterSelectWalletScene}
        options={{
          title: lstrings.title_register_fio_domain,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="fioDomainSettings" component={FioDomainSettingsScene} />
      <Stack.Screen
        name="fioNameConfirm"
        component={FioNameConfirmScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="fioRequestConfirmation" component={FioRequestConfirmationScene} />
      <Stack.Screen name="fioRequestList" component={FioRequestListScene} />
      <Stack.Screen
        name="fioSentRequestDetails"
        component={FioSentRequestDetailsScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="fioStakingChange" component={FioStakingChangeScene} />
      <Stack.Screen name="fioStakingOverview" component={FioStakingOverviewScene} />
      <Stack.Screen
        name="guiPluginAddressForm"
        component={AddressFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="guiPluginSepaForm"
        component={SepaFormScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="guiPluginInfoDisplay"
        component={InfoDisplayScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="loanClose" component={LoanCloseScene} />
      <Stack.Screen name="loanCreate" component={LoanCreateScene} />
      <Stack.Screen name="loanCreateConfirmation" component={LoanCreateConfirmationScene} />
      <Stack.Screen name="loanDashboard" component={LoanDashboardScene} />
      <Stack.Screen name="loanDetails" component={LoanDetailsScene} />
      <Stack.Screen name="loanManage" component={LoanManageScene} />
      <Stack.Screen name="loanStatus" component={LoanStatusScene} />
      <Stack.Screen
        name="manageTokens"
        component={ManageTokensScene}
        options={{
          headerRight: () => null
        }}
      />

      <Stack.Screen name="migrateWalletCalculateFee" component={MigrateWalletCalculateFeeScene} />
      <Stack.Screen
        name="migrateWalletCompletion"
        component={MigrateWalletCompletionScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="migrateWalletSelectCrypto" component={MigrateWalletSelectCryptoScene} />
      <Stack.Screen
        name="notificationSettings"
        component={NotificationScene}
        options={{
          title: lstrings.settings_notifications,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="otpRepair" component={OtpRepairScene} options={{ headerShown: false }} />
      <Stack.Screen
        name="otpSetup"
        component={OtpSettingsScene}
        options={{
          title: lstrings.title_otp,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="passwordRecovery"
        component={ChangeRecoveryScene}
        options={{
          title: lstrings.title_password_recovery,
          headerRight: () => null
        }}
      />
      <Stack.Screen
        name="upgradeUsername"
        component={UpgradeUsernameScene}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="pluginView"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginView'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
      <Stack.Screen
        name="promotionSettings"
        component={PromotionSettingsScene}
        options={{
          title: lstrings.title_promotion_settings,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="request" component={RequestScene} />
      <Stack.Screen name="securityAlerts" component={SecurityAlertsScene} options={{ headerShown: false }} />
      <Stack.Screen name="send2" component={SendScene2} />
      <Stack.Screen
        name="settingsOverview"
        component={SettingsScene}
        options={{
          title: lstrings.title_settings
        }}
        listeners={{
          focus: () => {
            dispatch(showReEnableOtpModal()).catch(err => showError(err))
          }
        }}
      />
      <Stack.Screen
        name="spendingLimits"
        component={SpendingLimitsScene}
        options={{
          title: lstrings.spending_limits,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="stakeModify" component={StakeModifyScene} />
      <Stack.Screen name="stakeOptions" component={StakeOptionsScene} />
      <Stack.Screen name="stakeOverview" component={StakeOverviewScene} />
      <Stack.Screen
        name="transactionDetails"
        component={TransactionDetailsScene}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />
      <Stack.Screen
        name="transactionsExport"
        component={TransactionsExportScene}
        options={{
          title: lstrings.title_export_transactions,
          headerRight: () => null
        }}
      />
      <Stack.Screen name="wcConnect" component={WcConnectScene} />
      <Stack.Screen name="wcConnections" component={WcConnectionsScene} />
      <Stack.Screen name="wcDisconnect" component={WcDisconnectScene} />
      <Stack.Screen
        name="webView"
        component={WebViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'webView'> fromParams={params => params.title} />
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeTabs = () => {
  const { defaultScreen } = getDeviceSettings()
  const initialRouteName = defaultScreen === 'assets' ? 'walletsTab' : 'homeTab'

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      tabBar={props => <MenuTabs {...props} />}
      screenOptions={{
        headerShown: false
      }}
    >
      <Tab.Screen name="homeTab" component={EdgeHomeTabScreen} />
      <Tab.Screen name="walletsTab" component={EdgeWalletsTabScreen} />
      <Tab.Screen name="buyTab" component={EdgeBuyTabScreen} />
      <Tab.Screen name="sellTab" component={EdgeSellTabScreen} />
      <Tab.Screen name="swapTab" component={EdgeSwapTabScreen} />
      <Tab.Screen name="extraTab" component={ExtraTabScene} />
      <Tab.Screen name="devTab" component={DevTestScene} />
    </Tab.Navigator>
  )
}

const EdgeHomeTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="home" screenOptions={defaultScreenOptions}>
      <Stack.Screen name="home" component={HomeSceneUi4} options={firstSceneScreenOptions} />
    </Stack.Navigator>
  )
}

const EdgeWalletsTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="walletList" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="transactionDetails"
        component={TransactionDetailsScene}
        options={{
          headerTitle: () => <TransactionDetailsTitle />
        }}
      />
      <Stack.Screen name="walletList" component={WalletListScene} options={firstSceneScreenOptions} />
      <Stack.Screen name="transactionList" component={TransactionList} />
    </Stack.Navigator>
  )
}

const EdgeBuyTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="pluginListBuy" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="guiPluginEnterAmount"
        component={FiatPluginEnterAmountScene}
        options={{
          headerRight: () => null
        }}
      />
      <Stack.Screen name="pluginListBuy" component={GuiPluginListScene} options={firstSceneScreenOptions} />
      <Stack.Screen name="guiPluginWebView" component={FiatPluginWebViewComponent} />
      <Stack.Screen
        name="pluginViewBuy"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewBuy'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeSellTabScreen = () => {
  return (
    <Stack.Navigator initialRouteName="pluginListSell" screenOptions={defaultScreenOptions}>
      <Stack.Screen name="guiPluginEnterAmount" component={FiatPluginEnterAmountScene} />
      <Stack.Screen name="pluginListSell" component={GuiPluginListScene} options={firstSceneScreenOptions} />
      <Stack.Screen name="guiPluginWebView" component={FiatPluginWebViewComponent} />
      <Stack.Screen name="rewardsCardDashboard" component={RewardsCardDashboardScene} />
      <Stack.Screen name="rewardsCardWelcome" component={RewardsCardWelcomeScene} />
      <Stack.Screen
        name="pluginViewSell"
        component={GuiPluginViewScene}
        options={{
          headerTitle: () => <ParamHeaderTitle<'pluginViewSell'> fromParams={params => params.plugin.displayName} />,
          headerRight: () => <HeaderTextButton type="exit" />,
          headerLeft: () => <PluginBackButton />
        }}
      />
    </Stack.Navigator>
  )
}

const EdgeSwapTabScreen = () => {
  const dispatch = useDispatch()
  return (
    <Stack.Navigator initialRouteName="swapCreate" screenOptions={defaultScreenOptions}>
      <Stack.Screen
        name="swapCreate"
        component={SwapCreateScene}
        options={{
          ...firstSceneScreenOptions,
          title: lstrings.title_exchange
        }}
        listeners={{
          focus: () => dispatch(checkEnabledExchanges())
        }}
      />
      <Stack.Screen name="swapConfirmation" component={SwapConfirmationScene} />
      <Stack.Screen
        name="swapProcessing"
        component={SwapProcessingScene}
        options={{
          headerLeft: () => null,
          headerRight: () => null
        }}
      />
    </Stack.Navigator>
  )
}
