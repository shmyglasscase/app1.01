import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { X, Mail, MessageCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react-native';

interface HelpCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export function HelpCenterModal({ visible, onClose }: HelpCenterModalProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I add items to my collection?',
      answer:
        'Navigate to the Collection tab and tap the + button. You can then add photos, descriptions, and other details about your items.',
    },
    {
      question: 'How does the marketplace work?',
      answer:
        'List items from your collection for sale or trade. Other users can browse, make offers, and message you directly about items they\'re interested in.',
    },
    {
      question: 'Can I share my collection with others?',
      answer:
        'Yes! Select items from your collection and use the share feature to create a shareable link that others can view.',
    },
    {
      question: 'How do I edit or delete items?',
      answer:
        'Long-press any item in your collection to see options for editing or removing it.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes, all your data is securely stored and encrypted. We take your privacy seriously and never share your information without permission.',
    },
  ];

  const ContactOption = ({
    icon,
    title,
    description,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.contactOption} onPress={onPress}>
      <View style={styles.contactIcon}>{icon}</View>
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );

  const FAQItem = ({ item, index }: { item: FAQItem; index: number }) => {
    const isExpanded = expandedFAQ === index;

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpandedFAQ(isExpanded ? null : index)}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          {isExpanded ? (
            <ChevronUp size={20} color="#718096" />
          ) : (
            <ChevronDown size={20} color="#718096" />
          )}
        </View>
        {isExpanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
      </TouchableOpacity>
    );
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@myglasscase.com');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help Center</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Support</Text>
            <View style={styles.contactList}>
              <ContactOption
                icon={<Mail size={20} color="#38a169" />}
                title="Email Support"
                description="Get help via email within 24 hours"
                onPress={handleEmailSupport}
              />
              <ContactOption
                icon={<MessageCircle size={20} color="#38a169" />}
                title="Live Chat"
                description="Chat with our support team (Coming Soon)"
                onPress={() => {}}
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color="#718096" />
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            </View>
            <View style={styles.faqList}>
              {faqs.map((faq, index) => (
                <FAQItem key={index} item={faq} index={index} />
              ))}
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Still need help?</Text>
            <Text style={styles.infoText}>
              Our support team is here to help you with any questions or issues you may have.
              Don't hesitate to reach out!
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
  },
  closeButton: {
    position: 'absolute',
    right: 24,
    top: 60,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0aec0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  contactList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f7fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#718096',
  },
  faqList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginTop: 12,
  },
  infoBox: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
});
