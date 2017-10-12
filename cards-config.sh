#!/bin/bash

echo "Configuring 6x RX 470. Sleeping 5 seconds before start. Ctrl+C to terminate immediately."
sleep 5

configure_card () {

    echo "== Configure card$1"

    DEVICE_PATH="/sys/devices/pci0000:00/$2/drm/card$1/device"

    CURRENT_MCLK="$(cat ${DEVICE_PATH}/pp_dpm_mclk | grep "*" | grep -oP '\s\d+' | sed "s/\s//g")"
    #CURRENT_SCLK="$(cat ${DEVICE_PATH}/pp_dpm_sclk | grep "*" | grep -oP '\s\d+' | sed "s/\s//g")"

    echo "Current mclk: ${CURRENT_MCLK} Mhz"
    #echo "Current sclk: ${CURRENT_SCLK} Mhz"

    echo $3 > ${DEVICE_PATH}/pp_mclk_od
    #echo $4 > ${DEVICE_PATH}/pp_sclk_od

    sleep 4

    NEW_MCLK="$(cat ${DEVICE_PATH}/pp_dpm_mclk | grep "*" | grep -oP '\s\d+' | sed "s/\s//g")"

    #sleep 2

    #NEW_SCLK="$(cat ${DEVICE_PATH}/pp_dpm_sclk | grep "*" | grep -oP '\s\d+' | sed "s/\s//g")"

    echo "New mclk: ${NEW_MCLK} Mhz ($3)"
    #echo "New sclk: ${NEW_SCLK} Mhz ($4)"

    printf "\n"
}

configure_card 0 "0000:00:01.0/0000:01:00.0" 17
configure_card 1 "0000:00:1c.2/0000:03:00.0" 17
configure_card 2 "0000:00:1c.3/0000:04:00.0" 17
configure_card 3 "0000:00:1c.4/0000:05:00.0" 17
configure_card 4 "0000:00:1c.5/0000:06:00.0" 17
configure_card 5 "0000:00:1c.6/0000:07:00.0" 17

#configure_card 0 "0000:00:01.0/0000:01:00.0" 17 0
#configure_card 1 "0000:00:1c.2/0000:03:00.0" 17 0
#configure_card 2 "0000:00:1c.3/0000:04:00.0" 17 0
#configure_card 3 "0000:00:1c.4/0000:05:00.0" 17 0
#configure_card 4 "0000:00:1c.5/0000:06:00.0" 17 0
#configure_card 5 "0000:00:1c.6/0000:07:00.0" 17 0