import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useRef } from 'react';
import { InfoContentProps } from '../types/props';
import { Info } from '../types/enums';

export default function InfoContent(props: InfoContentProps) {
    const scrollViewRef = useRef<ScrollView>(null);

    function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
        const isScrolledToEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height;

        if (isScrolledToEnd) {
            props.understand();
        }
    }

    return (
        <ScrollView
            ref={scrollViewRef}
            style={styles.container}
            onScrollEndDrag={handleScrollEnd}
        >
            {
                props.info === Info.TermsOfUse ?
                <View>
                    <Text style={styles.text}>
                        Welcome to Maze Factory! These Terms of Use ("Terms") govern your access to and use of the Maze Factory mobile application ("App"). By accessing or using the App, you agree to comply with these Terms. If you do not agree with any part of these Terms, please refrain from using the App.
                    </Text>
                    <Text style={styles.heading}>1. User-Generated Content</Text>
                    <Text style={styles.subheading}>1.1 Content Generation</Text>
                    <Text style={styles.text}>
                        The App allows users to generate content, including selecting an email address to be publicly displayed and naming mazes they create within the App. By submitting such content, you acknowledge that you have the necessary rights and permissions to do so.
                    </Text>
                    <Text style={styles.subheading}>1.2 Appropriate Content</Text>
                    <Text style={styles.text}>
                        You agree to generate and post content that is appropriate and complies with the following guidelines:
                    </Text>
                    <Text style={styles.text}>a) Content must not violate any applicable laws, regulations, or third-party rights.</Text>
                    <Text style={styles.text}>b) Content must not contain defamatory, abusive, threatening, or harassing language.</Text>
                    <Text style={styles.text}>c) Content must not be hateful, discriminatory, or promote violence or illegal activities.</Text>
                    <Text style={styles.text}>d) Content must not include sexually explicit material.</Text>
                    <Text style={styles.text}>e) Content must not infringe upon intellectual property rights, including copyrights or trademarks.</Text>
                    <Text style={styles.subheading}>1.3 Content Review</Text>
                    <Text style={styles.text}>
                        We reserve the right to review and moderate all user-generated content before it is publicly displayed in the App. We may remove or refuse to display any content that we deem inappropriate or violates these Terms.
                    </Text>
                    <Text style={styles.heading}>2. Intellectual Property</Text>
                    <Text style={styles.subheading}>2.1 Ownership</Text>
                    <Text style={styles.text}>
                        All intellectual property rights in the App and its content, including but not limited to software, design, graphics, text, images, and logos, are owned by or licensed to us. These rights are protected by applicable intellectual property laws.
                    </Text>
                    <Text style={styles.subheading}>2.2 License</Text>
                    <Text style={styles.text}>
                        By submitting user-generated content in the App, you grant a worldwide, non-exclusive, royalty-free, transferable license to use, reproduce, modify, adapt, publish, distribute, publicly display, and perform that content for the purpose of operating, promoting, and improving the App.
                    </Text>
                    <Text style={styles.heading}>3. User Responsibilities</Text>
                    <Text style={styles.subheading}>3.1 Account Creation</Text>
                    <Text style={styles.text}>
                        You may need to create an account to access certain features of the App. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </Text>
                    <Text style={styles.subheading}>3.2 Compliance</Text>
                    <Text style={styles.text}>
                        You agree to use the App in compliance with these Terms, applicable laws, and regulations. You shall not engage in any unauthorized or illegal activities that may harm the App or other users.
                    </Text>
                    <Text style={styles.heading}>4. Limitation of Liability</Text>
                    <Text style={styles.subheading}>4.1 Use at Your Own Risk</Text>
                    <Text style={styles.text}>
                        You acknowledge that your use of the App is at your sole risk. We make no warranties or representations regarding the accuracy, reliability, or availability of the App or its content.
                    </Text>
                    <Text style={styles.subheading}>4.2 Indemnification</Text>
                    <Text style={styles.text}>
                        You agree to indemnify and hold us harmless from any claims, damages, losses, or liabilities arising out of your use of the App, your violation of these Terms, or your infringement of any third-party rights.
                    </Text>
                    <Text style={styles.heading}>5. Modifications and Termination</Text>
                    <Text style={styles.subheading}>5.1 Modifications</Text>
                    <Text style={styles.text}>
                        We reserve the right to modify or update these Terms at any time, with or without notice. It is your responsibility to review these Terms periodically for any changes.
                    </Text>
                    <Text style={styles.subheading}>5.2 Termination</Text>
                    <Text style={styles.text}>
                        We may terminate or suspend your access to the App at any time and without prior notice, for any reason, including if we believe you have violated these Terms.
                    </Text>
                    <Text style={styles.heading}>6. Governing Law</Text>
                    <Text style={styles.text}>
                        These Terms shall be governed by and construed in accordance with the laws of the United States of America. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts located in the United States of America.
                    </Text>
                    <Text style={styles.heading}>
                        By using Maze Factory, you agree to abide by these Terms of Use.
                    </Text>
                    <Text style={styles.text}>
                        If you have any questions or concerns regarding these Terms, please contact mazefactoryapp@gmail.com.
                    </Text>
                    <Text style={styles.text}>
                        Last updated: Jul. 8, 2023
                    </Text>
                </View> :
                <View>
                    <Text style={styles.text}>
                        We are committed to protecting the privacy and security of our users. This Privacy Policy outlines the types of personal information we collect, how we use and protect that information, and the choices you have regarding your personal data. Please read this policy carefully to understand our practices regarding your personal information.
                    </Text>
                    <Text style={styles.heading}>1. Information We Collect</Text>
                    <Text style={styles.subheading}>1.1 Personal Information:</Text>
                    <Text style={styles.text}>
                        We may collect the following personal information from users of our app:
                    </Text>
                    <Text style={styles.text}>
                        a. Email Address: We collect your email address for authentication purposes and to communicate important information regarding your account.
                    </Text>
                    <Text style={styles.text}>
                        b. Password: Your password is securely stored and encrypted to protect your account.
                    </Text>
                    <Text style={styles.text}>
                        c. Maze Creation History: We track the mazes you create within the app to provide a personalized experience and enable you to manage and modify your created mazes.
                    </Text>
                    <Text style={styles.text}>
                        d. Maze Play History: We keep a record of the mazes you have played and how many attempts you have left to provide a competitive gaming environment.
                    </Text>
                    <Text style={styles.text}>
                        e. Maze Solve Time Records: We collect and store maze solve time records to calculate your global rank and provide a competitive gaming environment.
                    </Text>
                    <Text style={styles.text}>
                        f. Favorited Mazes: We maintain a list of the mazes you have favorited to enable you to access them easily.
                    </Text>
                    <Text style={styles.subheading}>1.2 Non-Personal Information:</Text>
                    <Text style={styles.text}>
                        We may also collect non-personal information, which does not directly identify you. This includes:
                    </Text>
                    <Text style={styles.text}>
                        Device Information: We may collect information about the device you use to access our app, such as the device type, operating system, unique device identifiers, and IP address.
                    </Text>
                    <Text style={styles.text}>
                        Usage Data: We gather information on how you use our app, including the features you interact with, the duration of your app sessions, and any error logs or crash reports generated during your app usage.
                    </Text>
                    <Text style={styles.heading}>2. Use of Collected Information</Text>
                    <Text style={styles.text}>
                        We use the collected information for the following purposes:
                    </Text>
                    <Text style={styles.text}>
                        a. To authenticate your account and ensure the security of our app.
                    </Text>
                    <Text style={styles.text}>
                        b. To label your creations and accomplishments with your username as derived from your account's email address.
                    </Text>
                    <Text style={styles.text}>
                        c. To track maze creation history, play history, and maze solve time records to enhance your gaming experience.
                    </Text>
                    <Text style={styles.text}>
                        d. To calculate global ranks based on maze solve time records.
                    </Text>
                    <Text style={styles.text}>
                        e. To enable you to access your favorited mazes easily.
                    </Text>
                    <Text style={styles.text}>
                        f. To improve and optimize our app's performance, functionality, and user experience.
                    </Text>
                    <Text style={styles.text}>
                        g. To communicate important updates, notifications, and promotional offers related to our app.
                    </Text>
                    <Text style={styles.heading}>3. Data Sharing and Disclosure</Text>
                    <Text style={styles.text}>
                        We understand the importance of protecting your personal information. We do not sell, trade, or rent your personal information to third parties. However, we may share your information in the following circumstances:
                    </Text>
                    <Text style={styles.text}>
                        a. Service Providers: We may engage trusted third-party service providers who assist us in operating our app, conducting our business, or providing services to you. These service providers are bound by confidentiality agreements and are only authorized to use your personal information as necessary to perform the services on our behalf.
                    </Text>
                    <Text style={styles.text}>
                        b. Legal Requirements: We may disclose your personal information if required by law, court order, or governmental authority to comply with any applicable laws, regulations, legal processes, or enforceable governmental requests.
                    </Text>
                    <Text style={styles.text}>
                        c. Protection of Rights: We may disclose personal information to protect the rights, property, or safety of our app, users, or others. This includes exchanging information with other companies and organizations for fraud protection and credit risk reduction.
                    </Text>
                    <Text style={styles.heading}>4. Data Security</Text>
                    <Text style={styles.text}>
                        We take the security of your personal information seriously and implement reasonable security measures to protect it. However, please note that no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                    </Text>
                    <Text style={styles.heading}>5. Your Choices and Rights</Text>
                    <Text style={styles.text}>
                        You have certain rights regarding your personal information. You can:
                    </Text>
                    <Text style={styles.text}>
                        a. Access and Update: You can access and update your personal information by contacting us at mazefactoryapp@gmail.com. Most information is readily available within the app's interface, aside from individual mazes for which you hold the record.
                    </Text>
                    <Text style={styles.text}>
                        b. Delete Account: You can request the deletion of your account and associated personal information by contacting us at mazefactoryapp@gmail.com.
                    </Text>
                    <Text style={styles.text}>
                        c. Communication Preferences: You can choose to opt-out of receiving promotional emails or notifications from us by following the instructions provided in such communications.
                    </Text>
                    <Text style={styles.heading}>6. Children's Privacy</Text>
                    <Text style={styles.text}>
                        Our app is not intended for children under the age of 4. We do not knowingly collect or solicit personal information from children under 4. If you believe that we have inadvertently collected personal information from a child under 4, please contact mazefactoryapp@gmail.com immediately, and we will promptly delete the information.
                    </Text>
                    <Text style={styles.heading}>7. Changes to the Privacy Policy</Text>
                    <Text style={styles.text}>
                        We reserve the right to modify or update this Privacy Policy at any time. If we make any material changes, we will notify you by updating the "Effective Date" at the end of this policy. We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your personal information.
                    </Text>
                    <Text style={styles.heading}>8. Contact Us</Text>
                    <Text style={styles.text}>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact mazefactoryapp@gmail.com.
                    </Text>
                    <Text style={styles.heading}>
                        By using Maze Factory, you signify your acceptance of this Privacy Policy. If you do not agree with this policy, please do not use our app.
                    </Text>
                    <Text style={styles.text}>
                        Thank you for entrusting us with your personal information.
                    </Text>
                    <Text style={styles.text}>
                        Last Updated: Jul. 8, 2023
                    </Text>
                </View>
            }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        margin: 5,
        height: 460,
    },
    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    subheading: {
        fontSize: 15,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    text: {
        fontSize: 14,
        marginVertical: 2,
    },
});
