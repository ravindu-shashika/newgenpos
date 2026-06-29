<?php

namespace App\Services;

use App\SMSProviders\BdBulkSms;
use App\SMSProviders\ReveSms;
use App\SMSProviders\TonkraSms;
use App\SMSProviders\ZirconSms;

class SmsService
{
    private $_tonkraSms;
    private $_reveSms;
    private $_bdbulkSms;
    private $_zirconSms;

    public function __construct(TonkraSms $tonkraSms, ReveSms $reveSms, BdBulkSms $bdBulkSms, ZirconSms $zirconSms)
    {
        $this->_tonkraSms = $tonkraSms;
        $this->_reveSms = $reveSms;
        $this->_bdbulkSms = $bdBulkSms;
        $this->_zirconSms = $zirconSms;
    }

    public function initialize($data)
    {
        $smsServiceProviderName = $data['sms_provider_name'];

        switch ($smsServiceProviderName) {
            case 'tonkra':
                return $this->_tonkraSms->send($data);
            case 'revesms':
                return $this->_reveSms->send($data);
            case 'bdbulksms':
                return $this->_bdbulkSms->send($data);
            case 'zircon':
                return $this->_zirconSms->send($data);
            default:
                break;
        }
    }
}
