import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacyTerms() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </Pressable>
        <Text style={styles.title}>سياسة الخصوصية وشروط الاستخدام</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>١. المقدمة</Text>
        <Text style={styles.text}>
          مرحبًا بك في TribbleBook! خصوصيتك مهمة بالنسبة لنا. توضح سياسة الخصوصية وشروط الاستخدام هذه كيف نجمع معلوماتك ونستخدمها ونفصح عنها ونحميها عند استخدامك لتطبيقنا. باستخدامك TribbleBook، فإنك توافق على هذه الشروط.
        </Text>
        <Text style={styles.sectionTitle}>٢. المعلومات التي نجمعها</Text>
        <Text style={styles.text}>
          - البيانات الشخصية: الاسم، البريد الإلكتروني، صورة الملف الشخصي، وأي معلومات أخرى تقدمها أثناء التسجيل أو تحديث الملف الشخصي.{"\n"}
          - بيانات الاستخدام: معلومات حول تفاعلاتك مع التطبيق مثل المنشورات، الإعجابات، التعليقات، والمجتمعات التي تنضم إليها.{"\n"}
          - بيانات الجهاز: نوع الجهاز، نظام التشغيل، ومعرفات الجهاز الفريدة.
        </Text>
        <Text style={styles.sectionTitle}>٣. كيف نستخدم معلوماتك</Text>
        <Text style={styles.text}>
          نستخدم معلوماتك من أجل:
          {"\n"}- توفير وصيانة التطبيق
          {"\n"}- تخصيص تجربتك
          {"\n"}- التواصل معك
          {"\n"}- تحسين خدماتنا
          {"\n"}- ضمان الأمان ومنع الاحتيال
        </Text>
        <Text style={styles.sectionTitle}>٤. مشاركة معلوماتك</Text>
        <Text style={styles.text}>
          لا نقوم ببيع معلوماتك الشخصية. قد نشارك بياناتك مع:
          {"\n"}- مزودي الخدمات الذين يساعدوننا في تشغيل التطبيق
          {"\n"}- السلطات القانونية إذا طُلب منا ذلك بموجب القانون
          {"\n"}- المستخدمين الآخرين، فقط كجزء من وظائف التطبيق العادية (مثل ملفك الشخصي ومنشوراتك)
        </Text>
        <Text style={styles.sectionTitle}>٥. حقوقك</Text>
        <Text style={styles.text}>
          لديك الحق في:
          {"\n"}- الوصول إلى معلوماتك أو تحديثها أو حذفها
          {"\n"}- الاعتراض على بعض عمليات المعالجة أو تقييدها
          {"\n"}- سحب الموافقة في أي وقت
        </Text>
        <Text style={styles.sectionTitle}>٦. أمان البيانات</Text>
        <Text style={styles.text}>
          نقوم بتنفيذ تدابير معقولة لحماية بياناتك. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت أو تخزين إلكتروني آمنة بنسبة 100٪.
        </Text>
        <Text style={styles.sectionTitle}>٧. خصوصية الأطفال</Text>
        <Text style={styles.text}>
          تطبيقنا غير موجه للأطفال دون سن 13 عامًا. لا نجمع بيانات عن قصد من الأطفال دون 13 عامًا.
        </Text>
        <Text style={styles.sectionTitle}>٨. التغييرات على هذه السياسة</Text>
        <Text style={styles.text}>
          قد نقوم بتحديث سياسة الخصوصية وشروط الاستخدام من وقت لآخر. سنخطرك بأي تغييرات من خلال تحديث التاريخ في أعلى هذه الصفحة.
        </Text>
        <Text style={styles.sectionTitle}>٩. التواصل معنا</Text>
        <Text style={styles.text}>
          إذا كان لديك أي أسئلة أو استفسارات حول هذه السياسة، يرجى التواصل معنا عبر البريد الإلكتروني: support@TribbleBook.com
        </Text>
        <Text style={styles.sectionTitle}>١٠. شروط الاستخدام</Text>
        <Text style={styles.text}>
          باستخدامك TribbleBook، فإنك توافق على:
          {"\n"}- استخدام التطبيق فقط للأغراض المشروعة
          {"\n"}- احترام حقوق وخصوصية المستخدمين الآخرين
          {"\n"}- عدم نشر محتوى ضار أو مسيء أو غير قانوني
          {"\n"}- عدم محاولة اختراق أو تعطيل أو إساءة استخدام التطبيق
        </Text>
        <Text style={styles.sectionTitle}>١١. إنهاء الحساب</Text>
        <Text style={styles.text}>
          نحتفظ بالحق في تعليق أو إنهاء حسابك إذا انتهكت هذه الشروط أو شاركت في سلوك ضار.
        </Text>
        <Text style={styles.sectionTitle}>١٢. القانون المعمول به</Text>
        <Text style={styles.text}>
          تخضع هذه الشروط لقوانين ولايتك القضائية. سيتم حل أي نزاعات وفقًا للقوانين المحلية.
        </Text>
        <Text style={styles.text}>
          شكرًا لاستخدامك TribbleBook!
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    color: '#0095f6',
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Bold',
    textAlign: 'right',
  },
  text: {
    fontSize: 15,
    color: '#222',
    lineHeight: 24,
    fontFamily: 'ArbFONTS-Al-Jazeera-Arabic-Regular',
    marginBottom: 8,
    textAlign: 'right',
  },
});
