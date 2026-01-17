import React from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  COneTimePassword,
  COneTimePasswordInput,
  CRow,
} from '@coreui/react-pro'
import { DocsComponents, DocsExample } from 'src/components'

const OtpInput = () => {
  return (
    <CRow>
      <CCol xs={12}>
        <DocsComponents href="forms/one-time-password-input/" />
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React One Time Password (OTP) Input</strong>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              The <code>&lt;COneTimePassword /&gt;</code> and{' '}
              <code>&lt;COneTimePasswordInput /&gt;</code> components create secure{' '}
              <strong>React OTP input fields</strong> with automatic character navigation and
              validation. Perfect for two-factor authentication, SMS verification codes, and secure
              login flows.
            </p>
            <DocsExample href="forms/one-time-password-input/#example">
              <CForm>
                <COneTimePassword label="Enter OTP Code" id="basicOTP" name="otp">
                  <COneTimePasswordInput />
                  <COneTimePasswordInput />
                  <COneTimePasswordInput />
                  <COneTimePasswordInput />
                  <COneTimePasswordInput />
                  <COneTimePasswordInput />
                </COneTimePassword>
              </CForm>
            </DocsExample>
          </CCardBody>
        </CCard>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React One Time Password (OTP) Input</strong>{' '}
            <small>One-time password types</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              The one-time password input supports different input types for various use cases.
            </p>
            <DocsExample href="forms/one-time-password-input/#one-time-password-types">
              <>
                <div className="mb-3">
                  <COneTimePassword label="Numeric OTP (default)" type="number">
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                  </COneTimePassword>
                </div>
                <div className="mb-3">
                  <COneTimePassword label="Text OTP" type="text">
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                  </COneTimePassword>
                </div>
                <div>
                  <COneTimePassword label="Masked OTP (hidden characters)" masked>
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                  </COneTimePassword>
                </div>
              </>
            </DocsExample>
          </CCardBody>
        </CCard>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>React One Time Password (OTP) Input</strong> <small>Custom layouts</small>
          </CCardHeader>
          <CCardBody>
            <p className="text-body-secondary small">
              Create custom one-time password layouts with separators and different field counts.
            </p>
            <DocsExample href="forms/one-time-password-input/#custom-layouts">
              <>
                <div className="mb-3">
                  <COneTimePassword label="6-digit OTP with separators">
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <div className="px-2 text-body-tertiary fw-bold">-</div>
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                  </COneTimePassword>
                </div>
                <div className="mb-3">
                  <COneTimePassword label="9-digit OTP with separators">
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <div className="px-2 text-body-tertiary fw-bold">•</div>
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <div className="px-2 text-body-tertiary fw-bold">•</div>
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                  </COneTimePassword>
                </div>
                <div>
                  <COneTimePassword label="4-digit PIN" masked>
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                    <COneTimePasswordInput />
                  </COneTimePassword>
                </div>
              </>
            </DocsExample>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default OtpInput
