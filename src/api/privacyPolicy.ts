import request from './request'

export interface PlatformPrivacyPolicy {
  privacy_policy_title: string
  privacy_policy_effective_date: string
  privacy_policy_content: string
  privacy_policy_contact_phone: string
  privacy_policy_contact_email: string
}

export function getPlatformPrivacyPolicy() {
  return request.get<any, PlatformPrivacyPolicy>('/platform/privacy-policy')
}

export function updatePlatformPrivacyPolicy(body: PlatformPrivacyPolicy) {
  return request.put<any, PlatformPrivacyPolicy>('/platform/privacy-policy', body)
}
