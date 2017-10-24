// @flow

import _ from 'lodash';
import React, { Component } from 'react';
import { NativeModules } from 'react-native';
import { connect } from 'react-redux';

import { hideDialog, SimpleBottomSheet } from '../../../base/dialog';

const AudioMode = NativeModules.AudioMode;

/**
 * Maps each device type to a display name and icon.
 * TODO: internationalization.
 */
const deviceInfoMap = {
    BLUETOOTH: {
        iconName: 'bluetooth',
        text: 'Bluetooth',
        type: 'BLUETOOTH'
    },
    EARPIECE: {
        iconName: 'phone-talk',
        text: 'Phone',
        type: 'EARPIECE'
    },
    HEADPHONES: {
        iconName: 'headset',
        text: 'Headphones',
        type: 'HEADPHONES'
    },
    SPEAKER: {
        iconName: 'volume',
        text: 'Speaker',
        type: 'SPEAKER'
    }
};

/**
 * Variable to hold the reference to the exported component. This dialog is only
 * exported if the {@code AudioMode} module has the capability to get / set
 * audio devices.
 */
let DialogType;

/**
 * {@code PasswordRequiredPrompt}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * Used for hiding the dialog when the selection was completed.
     */
    dispatch: Function
};

type State = {

    /**
     * Array of available devices.
     */
    devices: Array<string>
};

/**
 * Implements a React {@code Component} which prompts the user when a password
 * is required to join a conference.
 */
class AudioRoutePickerDialog extends Component<Props, State> {
    state = {
        // Available audio devices, it will be set in componentWillMount.
        devices: []
    };

    /**
     * Initializes a new {@code PasswordRequiredPrompt} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Initializes the device list by querying the {@code AudioMode} module.
     *
     * @inheritdoc
     */
    componentWillMount() {
        AudioMode.getAudioDevices().then(({ devices, selected }) => {
            const audioDevices = [];

            if (devices) {
                for (const device of devices) {
                    const info = deviceInfoMap[device];

                    if (info) {
                        info.selected = device === selected;
                        audioDevices.push(info);
                    }
                }
            }

            if (audioDevices) {
                // Make sure devices is alphabetically sorted
                this.setState({ devices: _.sortBy(audioDevices, 'text') });
            }
        });
    }

    /**
     * Dispatches a redux action to hide this sheet.
     *
     * @returns {void}
     */
    _hide() {
        this.props.dispatch(hideDialog(DialogType));
    }

    _onCancel: () => void;

    /**
     * Cancels the dialog by hiding it.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        this._hide();
    }

    _onSubmit: (?Object) => void;

    /**
     * Handles the selection of a device on the sheet. The selected device will
     * be used by {@code AudioMode}.
     *
     * @param {Object} device - Object representing the selected device.
     * @private
     * @returns {void}
     */
    _onSubmit(device) {
        this._hide();
        AudioMode.setAudioDevice(device.type);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.state.devices.length) {
            return null;
        }

        return (
            <SimpleBottomSheet
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                options = { this.state.devices } />
        );
    }
}

// Only export the dialog if we have support for getting / setting audio devices
// in AudioMode.
if (AudioMode.getAudioDevices && AudioMode.setAudioDevice) {
    DialogType = connect()(AudioRoutePickerDialog);
}

export default DialogType;