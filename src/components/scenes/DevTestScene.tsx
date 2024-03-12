import { eq } from 'biggystring'
import { InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { ReturnKeyType, View } from 'react-native'

import { launchDeepLink } from '../../actions/DeepLinkingActions'
import { Fontello } from '../../assets/vector'
import { ENV } from '../../env'
import { useSelectedWallet } from '../../hooks/useSelectedWallet'
import { useState } from '../../types/reactHooks'
import { useDispatch } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { parseDeepLink } from '../../util/DeepLinkParser'
import { consify } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { CountryListModal } from '../modals/CountryListModal'
import { FioCreateHandleModal } from '../modals/FioCreateHandleModal'
import { FlipInputModal2, FlipInputModalResult } from '../modals/FlipInputModal2'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { Airship, showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts, ExchangedFlipInputRef } from '../themed/ExchangedFlipInput2'
import { FilledTextInput } from '../themed/FilledTextInput'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'
import { ButtonUi4 } from '../ui4/ButtonUi4'
import { CardUi4 } from '../ui4/CardUi4'
import { SectionHeaderUi4 } from '../ui4/SectionHeaderUi4'
import { SectionView } from '../ui4/SectionView'

interface Props extends EdgeSceneProps<'devTab'> {}

export function DevTestScene(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const dispatch = useDispatch()

  // TODO: Make this scene work without useSelectedWallet() for unit testing compatibility
  const selectedWallet = useSelectedWallet()
  const walletId = selectedWallet?.wallet.id ?? ''
  const tokenId = selectedWallet?.tokenId ?? null

  const [value0, setValue0] = useState<string>('')
  const [value1, setValue1] = useState<string>('')
  const [filledTextInputValue, setFilledTextInputValue] = useState<string>('')
  const [filledTextInputValue2, setFilledTextInputValue2] = useState<string>('')
  const [filledTextInputValue3, setFilledTextInputValue3] = useState<string>('')
  const [filledTextInputValue4, setFilledTextInputValue4] = useState<string>('')
  const [filledTextInputValue5, setFilledTextInputValue5] = useState<string>('')
  const [filledTextInputValue6, setFilledTextInputValue6] = useState<string>('')
  const [filledTextInputValue7, setFilledTextInputValue7] = useState<string>('')
  const [filledTextInputValue8, setFilledTextInputValue8] = useState<string>('')
  const [deepLinkInputValue, setDeepLinkInputValue] = useState<string>(`edge://scene/manageTokens?walletId=${walletId}`)

  const exchangedFlipInputRef = React.useRef<ExchangedFlipInputRef>(null)

  const onAmountChanged = (amounts: ExchangedFlipInputAmounts): void => {
    consify(amounts)
  }

  const onPress0 = () => {
    exchangedFlipInputRef.current?.setAmount('crypto', value0)
  }
  const onChangeText0 = (text: string) => {
    setValue0(text)
  }
  const onPress1 = () => {
    exchangedFlipInputRef.current?.setAmount('fiat', value1)
  }
  const onChangeText1 = (text: string) => {
    setValue1(text)
  }

  const onAmountsChanged = (amounts: ExchangedFlipInputAmounts) => {
    console.log(JSON.stringify(amounts, null, 2))
  }

  const handleFlipInputModal = () => {
    if (selectedWallet == null) return
    Airship.show<FlipInputModalResult>(bridge => {
      if (selectedWallet == null) return null
      return <FlipInputModal2 bridge={bridge} wallet={selectedWallet.wallet} tokenId={tokenId} feeTokenId={null} onAmountsChanged={onAmountsChanged} />
    }).catch(error => console.log(error))
  }

  const coreWallet = selectedWallet?.wallet
  let balance = coreWallet?.balanceMap.get(tokenId) ?? ''
  if (eq(balance, '0')) balance = ''
  const headerText = 'Select Wallet'
  const headerCallback = () => console.log('Header pressed')

  // Hack. If wallet name first char is lowercase, start with crypto focused, otherwise default to fiat
  const defaultField = (coreWallet?.name?.charAt(0).toLowerCase() ?? '') === (coreWallet?.name?.charAt(0) ?? '')

  // Hack. If wallet name 2nd char is lowercase, start with keyboard down
  const keyboardVisible = (coreWallet?.name?.charAt(1).toLowerCase() ?? '') !== (coreWallet?.name?.charAt(1) ?? '')

  const editable = (coreWallet?.name?.charAt(2).toLowerCase() ?? '') === (coreWallet?.name?.charAt(2) ?? '')
  const returnKeyType: ReturnKeyType = 'done'

  return (
    <SceneWrapper scroll hasTabs hasHeader={false}>
      <SectionView marginRem={1}>
        <FilledTextInput
          iconComponent={SearchIconAnimated}
          vertical={1}
          value={filledTextInputValue6}
          onChangeText={setFilledTextInputValue6}
          autoFocus={false}
          placeholder="Test big text"
          textsizeRem={1.5}
          maxLength={100}
        />
        <FilledTextInput
          numeric
          vertical={1}
          value={filledTextInputValue7}
          onChangeText={setFilledTextInputValue7}
          autoFocus={false}
          placeholder="Test big number"
          textsizeRem={1.5}
          maxLength={100}
        />
        <FilledTextInput
          vertical={1}
          value={filledTextInputValue}
          onChangeText={setFilledTextInputValue}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          maxLength={100}
        />
        <FilledTextInput
          vertical={1}
          prefix="PRE"
          value={filledTextInputValue2}
          onChangeText={setFilledTextInputValue2}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          maxLength={100}
        />
        <FilledTextInput
          numeric
          vertical={1}
          value={filledTextInputValue3}
          onChangeText={setFilledTextInputValue3}
          autoFocus={false}
          placeholder="Test FilledTextInput num"
        />
        <FilledTextInput
          numeric
          vertical={1}
          prefix="$"
          suffix="BTC"
          value={filledTextInputValue4}
          onChangeText={setFilledTextInputValue4}
          autoFocus={false}
          placeholder="Test FilledTextInput num"
          error="Error"
          maxLength={100}
        />
        <FilledTextInput
          vertical={1}
          prefix="USD"
          suffix="BTC"
          value={filledTextInputValue5}
          onChangeText={setFilledTextInputValue5}
          autoFocus={false}
          placeholder="Test FilledTextInput"
          error="Error"
          maxLength={100}
        />
        <>
          <FilledTextInput
            vertical={1}
            value={filledTextInputValue8}
            onChangeText={setFilledTextInputValue8}
            autoFocus={false}
            placeholder="Test FilledTextInput Custom Error"
            error={filledTextInputValue8 === '' ? undefined : filledTextInputValue8}
          />
          <EdgeText>Ensure errors above don't push me down</EdgeText>
        </>
        {selectedWallet == null ? null : (
          <CardUi4>
            <ExchangedFlipInput2
              ref={exchangedFlipInputRef}
              wallet={selectedWallet.wallet}
              headerText={headerText}
              editable={editable}
              headerCallback={headerCallback}
              returnKeyType={returnKeyType}
              forceField={defaultField ? 'crypto' : 'fiat'}
              keyboardVisible={keyboardVisible}
              tokenId={tokenId}
              startNativeAmount={balance}
              onAmountChanged={onAmountChanged}
            />
          </CardUi4>
        )}

        <>
          <SimpleTextInput vertical={1} value={value0} onChangeText={onChangeText0} autoFocus={false} placeholder="Crypto Amount" />
          <ButtonUi4 label="Set Crypto Amt" onPress={onPress0} />
          <SimpleTextInput vertical={1} value={value1} onChangeText={onChangeText1} autoFocus={false} placeholder="Fiat Amount" />
          <ButtonUi4 label="Set Fiat Amt" onPress={onPress1} />
        </>

        <>
          <SectionHeaderUi4 leftTitle="Modals" rightNode={<EdgeText>Galore</EdgeText>} />
          <ButtonUi4 label="FlipInputModal2" marginRem={0.25} onPress={handleFlipInputModal} />
          <ButtonUi4
            label="ButtonsModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<'test1' | 'test2' | 'test3' | undefined>(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title="ButtonsModal"
                  message="message message message message message message message"
                  buttons={{
                    test1: { label: 'Long Text Long Text' },
                    test2: { label: 'Long Text' },
                    test3: { label: 'Text' }
                  }}
                />
              ))
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="ConfirmContinueModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<boolean>(bridge => (
                <ConfirmContinueModal
                  bridge={bridge}
                  title="ConfirmContinueModal"
                  body="You agree this modal looks amazing. You agree this modal looks amazing. You agree this modal looks amazing. You agree this modal looks amazing."
                  onPress={async () => true}
                />
              ))
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="ConfirmContinueModal (warn)"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<boolean>(bridge => (
                <ConfirmContinueModal
                  bridge={bridge}
                  title="ConfirmContinueModal (warn)"
                  body="You agree this modal looks amazing."
                  warning
                  onPress={async () => true}
                />
              ))
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="CountryListModal"
            marginRem={0.25}
            onPress={async () => {
              const test = await Airship.show<string>(bridge => <CountryListModal bridge={bridge} countryCode="us" />)
              console.debug(test)
            }}
          />
          <ButtonUi4
            label="PasswordReminderModal"
            marginRem={0.25}
            onPress={async () => {
              await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
            }}
          />
          <ButtonUi4
            label="InsufficientFeesModal"
            marginRem={0.25}
            onPress={async () => {
              if (coreWallet == null) return
              await Airship.show(bridge => (
                <InsufficientFeesModal bridge={bridge} coreError={new InsufficientFundsError({ tokenId: null })} navigation={navigation} wallet={coreWallet} />
              ))
            }}
          />
          <ButtonUi4
            label="FioCreateHandleModal"
            marginRem={0.25}
            onPress={async () => {
              const isCreateHandle = await Airship.show<boolean>(bridge => <FioCreateHandleModal bridge={bridge} />)
              if (isCreateHandle) {
                const { freeRegApiToken = '', freeRegRefCode = '' } = typeof ENV.FIO_INIT === 'object' ? ENV.FIO_INIT : {}
                navigation.navigate('fioCreateHandle', { freeRegApiToken, freeRegRefCode })
              }
            }}
          />
        </>
        <>
          <SectionHeaderUi4 leftTitle="Buttons" />
          <ButtonUi4 onPress={() => {}} label="Button With Child" marginRem={0.5} type="secondary">
            <Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />
          </ButtonUi4>
          <EdgeText>Button with spinner and child (child shouldn't show)</EdgeText>
          <ButtonUi4 onPress={() => {}} label="Button With Child" marginRem={0.5} type="secondary" spinner>
            <Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />
          </ButtonUi4>
          <ButtonUi4 onPress={() => {}} label="Mini" marginRem={0.5} type="secondary" mini />
          <EdgeText style={{ marginVertical: theme.rem(0.5) }}>ButtonsViews</EdgeText>
          <OutlinedView>
            <ButtonsViewUi4
              primary={{ label: 'Primary', onPress: () => {} }}
              secondary={{ label: 'Secondary', onPress: () => {} }}
              tertiary={{ label: 'Tertiary Tertiary Tertiary Tertiary', onPress: () => {} }}
              layout="column"
            />
          </OutlinedView>
          <OutlinedView>
            <ButtonsViewUi4
              primary={{ label: 'Primary Primary', onPress: () => {} }}
              secondary={{ label: 'Secondary', onPress: () => {} }}
              tertiary={{ label: 'Tertiary', onPress: () => {} }}
              layout="column"
            />
          </OutlinedView>
          <OutlinedView>
            <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} layout="row" />
          </OutlinedView>
          <OutlinedView>
            <ButtonsViewUi4 secondary={{ label: 'Secondary', onPress: () => {} }} secondary2={{ label: 'Secondary', onPress: () => {} }} layout="row" />
          </OutlinedView>

          <EdgeText style={{ marginVertical: theme.rem(0.5) }}>Loose Buttons (0.5rem margin)</EdgeText>
          <OutlinedView>
            <ButtonUi4 marginRem={0.5} onPress={() => {}} label="Mini" type="secondary" mini />
            <ButtonUi4 marginRem={0.5} onPress={() => {}} label="Mini" type="secondary" mini />
          </OutlinedView>
          <OutlinedView>
            <ButtonUi4 marginRem={0.5} onPress={() => {}} label="Primary" type="primary" />
            <ButtonUi4 marginRem={0.5} onPress={() => {}} label="Secondary" type="secondary" />
            <ButtonUi4 marginRem={0.5} onPress={() => {}} label="Tertiary" type="tertiary" />
          </OutlinedView>
        </>
        <>
          <SectionHeaderUi4 leftTitle="DeepLinking" />
          <FilledTextInput
            vertical={0.5}
            value={deepLinkInputValue}
            onChangeText={setDeepLinkInputValue}
            autoFocus={false}
            placeholder="DeepLink"
            error={filledTextInputValue8 === '' ? undefined : filledTextInputValue8}
          />
          <ButtonUi4
            marginRem={0.5}
            onPress={() => {
              const parsed = parseDeepLink(deepLinkInputValue)
              console.debug('parsed deeplink: ', parsed)
              dispatch(launchDeepLink(navigation, parsed)).catch(e => showError(e))
            }}
            label="Activate DeepLink"
            type="primary"
          />
        </>
      </SectionView>
    </SceneWrapper>
  )
}

const OutlinedView = styled(View)({
  borderWidth: 1,
  borderColor: 'white',
  alignItems: 'center',
  justifyContent: 'center'
})
