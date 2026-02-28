import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Eye, Database, UserCheck, Mail, ArrowRight } from "lucide-react"

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Database className="w-5 h-5 text-primary" />,
      title: "البيانات التي نجمعها",
      content: [
        "بيانات الحساب: البريد الإلكتروني وكلمة المرور المشفرة عند التسجيل.",
        "بيانات المشتريات: تاريخ الشراء، العيار، الوزن، السعر، المصنعية، والمصروفات الأخرى.",
        "بيانات الاستخدام: سجلات الدخول وأوقات الجلسات بشكل مجهول.",
        "لا نجمع أي بيانات شخصية إضافية كالاسم أو العنوان أو رقم الهاتف.",
      ],
    },
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: "كيف نستخدم بياناتك",
      content: [
        "تشغيل الحساب: تسجيل الدخول والمصادقة على هويتك.",
        "حفظ مشترياتك: تخزين بيانات الذهب وعرضها لك فقط.",
        "حساب الأرباح والخسائر: استخدام أسعار الذهب الحية مع بياناتك.",
        "لا نشارك أو نبيع بياناتك لأي طرف ثالث مطلقاً.",
      ],
    },
    {
      icon: <Lock className="w-5 h-5 text-primary" />,
      title: "حماية البيانات",
      content: [
        "التشفير: جميع البيانات مشفرة أثناء النقل باستخدام HTTPS/TLS.",
        "المصادقة: نستخدم Supabase Auth مع JWT tokens آمنة.",
        "العزل: بيانات كل مستخدم معزولة تماماً عن باقي المستخدمين.",
        "كلمات المرور: مشفرة باستخدام bcrypt ولا يمكن لأحد الاطلاع عليها.",
      ],
    },
    {
      icon: <UserCheck className="w-5 h-5 text-primary" />,
      title: "حقوقك كمستخدم",
      content: [
        "حق الوصول: يمكنك عرض جميع بياناتك من داخل التطبيق في أي وقت.",
        "حق التعديل: يمكنك تعديل أو حذف أي من مشترياتك المسجلة.",
        "حق الحذف: يمكنك حذف حسابك ومعه جميع بياناتك نهائياً.",
        "حق التصدير: يمكنك تصدير مشترياتك بصيغة CSV في أي وقت.",
      ],
    },
    {
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: "خدمات الطرف الثالث",
      content: [
        "Supabase: قاعدة بيانات وخدمة مصادقة آمنة ومشفرة.",
        "Vercel: استضافة التطبيق مع حماية عالية المستوى.",
        "APIs أسعار الذهب: بيانات السوق فقط، لا تحتوي على بياناتك الشخصية.",
        "Vercel Analytics: إحصائيات مجهولة لتحسين أداء التطبيق.",
      ],
    },
    {
      icon: <Mail className="w-5 h-5 text-primary" />,
      title: "التواصل معنا",
      content: [
        "إذا كان لديك أي سؤال حول سياسة الخصوصية، يمكنك التواصل معنا.",
        "يمكن طلب حذف حسابك وبياناتك بالكامل في أي وقت.",
        "نلتزم بالرد على جميع استفسارات الخصوصية خلال 48 ساعة.",
        "نحترم خصوصيتك ونعمل بشفافية تامة.",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">🏆</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">محفظة الذهب</h1>
                <p className="text-xs text-muted-foreground">Gold Wallet</p>
              </div>
            </div>
            <Link href="/auth/sign-in">
              <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
                <ArrowRight className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">سياسة الخصوصية</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            نحن نأخذ خصوصيتك على محمل الجد. هذه الصفحة توضح كيف نجمع ونستخدم ونحمي بياناتك.
          </p>
          <p className="text-xs text-muted-foreground mt-2">آخر تحديث: فبراير 2026</p>
        </div>

        <div className="grid gap-6">
          {sections.map((section, index) => (
            <Card key={index} className="border-border/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {section.icon}
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center p-6 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground leading-relaxed">
            باستخدام تطبيق <span className="font-semibold text-foreground">محفظة الذهب</span>، فأنت توافق على سياسة الخصوصية هذه.
            نحتفظ بحق تحديث هذه السياسة مع إشعارك بأي تغييرات جوهرية عبر البريد الإلكتروني.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Link href="/auth/sign-in">
              <Button className="w-full sm:w-auto">تسجيل الدخول</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button variant="outline" className="w-full sm:w-auto">إنشاء حساب جديد</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}