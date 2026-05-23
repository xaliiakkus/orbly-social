import { StyleSheet, Text, View } from "react-native";

import { OrblyColors } from "@/constants/Colors";
import type { LegalSection } from "@/lib/legal-content";
import { LEGAL_META } from "@/lib/legal-content";

export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>
        Son güncelleme: {LEGAL_META.lastUpdated} · {LEGAL_META.productName}
      </Text>
      <Text style={styles.intro}>{intro}</Text>

      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((p, i) => (
            <Text key={`${section.id}-p-${i}`} style={styles.body}>
              {p}
            </Text>
          ))}
          {section.bullets?.map((item) => (
            <Text key={item.slice(0, 48)} style={styles.bullet}>
              {"\u2022"} {item}
            </Text>
          ))}
        </View>
      ))}

      <Text style={styles.footer}>
        Sorularınız için: {LEGAL_META.contactEmail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: OrblyColors.textPrimary,
    marginBottom: 8,
  },
  meta: { fontSize: 13, color: OrblyColors.textSecondary, marginBottom: 16 },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: OrblyColors.textSecondary,
    marginBottom: 24,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: OrblyColors.textPrimary,
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: OrblyColors.textSecondary,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: OrblyColors.textSecondary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OrblyColors.border,
    fontSize: 13,
    color: OrblyColors.textSecondary,
  },
});
