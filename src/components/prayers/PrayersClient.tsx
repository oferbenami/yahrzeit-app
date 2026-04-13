"use client";

import { useState } from "react";
import Link from "next/link";

type Nusach = "sephardi" | "mizrahi" | "ashkenaz";

const cardStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "1rem",
  boxShadow: "0 2px 10px rgba(184,134,11,0.07)",
};

// ─── Prayer texts ─────────────────────────────────────────────────────────────

const KADDISH = `יִתְגַּדַּל וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא.
(קהל: אָמֵן)

בְּעָלְמָא דִּי בְרָא כִרְעוּתֵהּ,
וְיַמְלִיךְ מַלְכוּתֵהּ,
בְּחַיֵּיכוֹן וּבְיוֹמֵיכוֹן
וּבְחַיֵּי דְכָל בֵּית יִשְׂרָאֵל,
בַּעֲגָלָא וּבִזְמַן קָרִיב.
וְאִמְרוּ אָמֵן.

(קהל: אָמֵן. יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ
לְעָלַם וּלְעָלְמֵי עָלְמַיָּא)

יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא.

יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר
וְיִתְרוֹמַם וְיִתְנַשֵּׂא
וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל
שְׁמֵהּ דְּקֻדְשָׁא בְּרִיךְ הוּא.
(קהל: אָמֵן)

לְעֵלָּא מִן כָּל בִּרְכָתָא וְשִׁירָתָא,
תֻּשְׁבְּחָתָא וְנֶחֱמָתָא,
דַּאֲמִירָן בְּעָלְמָא.
וְאִמְרוּ אָמֵן.
(קהל: אָמֵן)

יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא,
וְחַיִּים עָלֵינוּ וְעַל כָּל יִשְׂרָאֵל.
וְאִמְרוּ אָמֵן.
(קהל: אָמֵן)

עֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו,
הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ
וְעַל כָּל יִשְׂרָאֵל.
וְאִמְרוּ אָמֵן.
(קהל: אָמֵן)`;

const KADDISH_MIZRAHI = `יִתְגַּדַּל וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא.
בְּעָלְמָא דִי בְרָא כִרְעוּתֵהּ וְיַמְלִיךְ מַלְכוּתֵהּ
וְיַצְמַח פּוּרְקָנֵהּ וִיקָרֵב מְשִׁיחֵהּ.
בְּחַיֵיכוֹן וּבְיוֹמֵיכוֹן וּבְחַיֵי דְּכָל בֵּית יִשְׂרָאֵל,
בַּעֲגַלָא וּבִזְמַן קָרִיב. וְאִמְרוּ אָמֵן.
יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא.
יִתְבָּרַךְ וְיִשְׁתַּבַּח וְיִתְפָּאַר
וְיִתְרוֹמַם וְיִתְנַשֵּׂא וְיִתְהַדָּר וְיִתְעַלֶּה וְיִתְהַלָּל,
שְׁמֵהּ דְּקוּדְשָׁא בְּרִיךְ הוּא
לְעֵילָא מִן כָּל בִּרְכָתָא שִׁירָתָא,
תִּשְׁבְּחָתָא וְנֶחָמָתָא, דַאֲמִירָן בְּעָלְמָא. וְאִמְרוּ אָמֵן.

עַל יִשְׂרָאֵל וְעַל רַבָּנָן וְעַל תַּלְמִידֵיהון
וְעַל כָּל תַּלְמִידֵי תַלְמִידֵיהון,
דְּעָסְקִין בְּאוֹרַיְתָא קַדִּישְׁתָּא,
דִּי בְאַתְרָא הָדֵין וְדִי בְכָל אָתָר וְאָתָר.
יְהֵא לָנָא וּלְהון וּלְכון חִנָּא וְחִסְדָּא וְרַחֲמֵי
מִן קֳדָם אֶלָהַא מָארֵה שְׁמַיָּא וְאַרְעָא. וְאִמְרוּ אָמֵן.

יְהֵא שְׁלָמָא רַבָּא מִן שְׁמַיָּא,
חַיִּים וְשָׂבָע וִישׁוּעָה וְנֶחָמָה וְשֵׁיזָבָא
וּרְפוּאָה וּסְלִיחָה וְכַפָּרָה וְרֶוַח וְהַצָּלָה,
לָנוּ וּלְכָל יִשְׂרָאֵל. וְאִמְרוּ אָמֵן.

עֹשֶׂה שָׁלוֹם בִּמְרוֹמָיו,
הוּא יַעֲשֶׂה שָׁלוֹם עָלֵינוּ
וְעַל כָּל יִשְׂרָאֵל. וְאִמְרוּ אָמֵן.`;

const HASHKAVA_ISH = `יִשְׁכַּב בְּשָׁלוֹם וְיָנוּחַ עַל מִשְׁכָּבוֹ בְּכָבוֹד
[שֵׁם הַנִּפְטָר] בֶּן [שֵׁם הָאָב]
שֶׁנִּפְטַר לְבֵית עוֹלָמוֹ.

יְכֻפַּר חֶטְאוֹ וְעֲוֹנוֹ וּפִשְׁעוֹ
בִּידֵי שָׁמַיִם.

יִרְאֶה בְּנֶחָמַת עַמּוֹ יִשְׂרָאֵל
וּבִבְנִיַּן יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ,
וְיִזְכֶּה לִתְחִיַּת הַמֵּתִים.

נִשְׁמָתוֹ תְּהֵא צְרוּרָה בִּצְרוֹר הַחַיִּים
עִם נִשְׁמוֹת אַבְרָהָם יִצְחָק וְיַעֲקֹב,
שָׂרָה רִבְקָה רָחֵל וְלֵאָה,
וְעִם שְׁאָר הַצַּדִּיקִים שֶׁבְּגַן עֵדֶן.

וְנֹאמַר אָמֵן.`;

const HASHKAVA_ISHA = `תִּשְׁכַּב בְּשָׁלוֹם וְתָנוּחַ עַל מִשְׁכָּבָהּ בְּכָבוֹד
[שֵׁם הַנִּפְטֶרֶת] בַּת [שֵׁם הָאָב]
שֶׁנִּפְטְרָה לְבֵית עוֹלָמָהּ.

יְכֻפַּר חֶטְאָהּ וַעֲוֹנָהּ וּפִשְׁעָהּ
בִּידֵי שָׁמַיִם.

תִּרְאֶה בְּנֶחָמַת עַמָּהּ יִשְׂרָאֵל
וּבִבְנִיַּן יְרוּשָׁלַיִם עִיר הַקֹּדֶשׁ,
וְתִזְכֶּה לִתְחִיַּת הַמֵּתִים.

נִשְׁמָתָהּ תְּהֵא צְרוּרָה בִּצְרוֹר הַחַיִּים
עִם נִשְׁמוֹת אַבְרָהָם יִצְחָק וְיַעֲקֹב,
שָׂרָה רִבְקָה רָחֵל וְלֵאָה,
וְעִם שְׁאָר הַצַּדִּיקוֹת שֶׁבְּגַן עֵדֶן.

וְנֹאמַר אָמֵן.`;

const EL_MALEH_ISH = `אֵל מָלֵא רַחֲמִים, שׁוֹכֵן בַּמְּרוֹמִים,
הַמְצֵא מְנוּחָה נְכוֹנָה תַּחַת כַּנְפֵי הַשְּׁכִינָה,
בְּמַעֲלוֹת קְדוֹשִׁים וּטְהוֹרִים
כְּזֹהַר הָרָקִיעַ מְזַהִירִים,
לְנִשְׁמַת [שֵׁם הַנִּפְטָר בֶּן שֵׁם אִמּוֹ]
שֶׁהָלַךְ לְעוֹלָמוֹ.

לְכֵן בַּעַל הָרַחֲמִים יַסְתִּירֵהוּ
בְּסֵתֶר כְּנָפָיו לְעוֹלָמִים,
וְיִצְרֹר בִּצְרוֹר הַחַיִּים
אֶת נִשְׁמָתוֹ.
ה' הוּא נַחֲלָתוֹ,
וְיָנוּחַ בְּשָׁלוֹם עַל מִשְׁכָּבוֹ.
וְנֹאמַר אָמֵן.`;

const EL_MALEH_ISHA = `אֵל מָלֵא רַחֲמִים, שׁוֹכֵן בַּמְּרוֹמִים,
הַמְצֵא מְנוּחָה נְכוֹנָה תַּחַת כַּנְפֵי הַשְּׁכִינָה,
בְּמַעֲלוֹת קְדוֹשִׁים וּטְהוֹרִים
כְּזֹהַר הָרָקִיעַ מְזַהִירִים,
לְנִשְׁמַת [שֵׁם הַנִּפְטֶרֶת בַּת שֵׁם אִמָּהּ]
שֶׁהָלְכָה לְעוֹלָמָהּ.

לְכֵן בַּעַל הָרַחֲמִים יַסְתִּירֶהָ
בְּסֵתֶר כְּנָפָיו לְעוֹלָמִים,
וְיִצְרֹר בִּצְרוֹר הַחַיִּים
אֶת נִשְׁמָתָהּ.
ה' הוּא נַחֲלָתָהּ,
וְתָנוּחַ בְּשָׁלוֹם עַל מִשְׁכָּבָהּ.
וְנֹאמַר אָמֵן.`;

const PSALM_91 = `יֹשֵׁב בְּסֵתֶר עֶלְיוֹן, בְּצֵל שַׁדַּי יִתְלוֹנָן.
אֹמַר לַה', מַחְסִי וּמְצוּדָתִי, אֱלֹהַי אֶבְטַח בּוֹ.
כִּי הוּא יַצִּילְךָ מִפַּח יָקוּשׁ, מִדֶּבֶר הַוּוֹת.
בְּאֶבְרָתוֹ יָסֶךְ לָךְ, וְתַחַת כְּנָפָיו תֶּחְסֶה, צִנָּה וְסֹחֵרָה אֲמִתּוֹ.
לֹא תִירָא מִפַּחַד לָיְלָה, מֵחֵץ יָעוּף יוֹמָם.
מִדֶּבֶר בָּאֹפֶל יַהֲלֹךְ, מִקֶּטֶב יָשׁוּד צָהֳרָיִם.
יִפֹּל מִצִּדְּךָ אֶלֶף, וּרְבָבָה מִימִינֶךָ, אֵלֶיךָ לֹא יִגָּשׁ.
רַק בְּעֵינֶיךָ תַבִּיט, וְשִׁלֻּמַת רְשָׁעִים תִּרְאֶה.
כִּי אַתָּה ה' מַחְסִי, עֶלְיוֹן שַׂמְתָּ מְעוֹנֶךָ.
לֹא תְאֻנֶּה אֵלֶיךָ רָעָה, וְנֶגַע לֹא יִקְרַב בְּאָהֳלֶךָ.
כִּי מַלְאָכָיו יְצַוֶּה לָּךְ, לִשְׁמָרְךָ בְּכָל דְּרָכֶיךָ.
עַל כַּפַּיִם יִשָּׂאוּנְךָ, פֶּן תִּגֹּף בָּאֶבֶן רַגְלֶךָ.
עַל שַׁחַל וָפֶתֶן תִּדְרֹךְ, תִּרְמֹס כְּפִיר וְתַנִּין.
כִּי בִי חָשַׁק וַאֲפַלְּטֵהוּ, אֲשַׂגְּבֵהוּ כִּי יָדַע שְׁמִי.
יִקְרָאֵנִי וְאֶעֱנֵהוּ, עִמּוֹ אָנֹכִי בְצָרָה, אֲחַלְּצֵהוּ וַאֲכַבְּדֵהוּ.
אֹרֶךְ יָמִים אַשְׂבִּיעֵהוּ, וְאַרְאֵהוּ בִּישׁוּעָתִי.`;

const PSALM_121 = `שִׁיר לַמַּעֲלוֹת, אֶשָּׂא עֵינַי אֶל הֶהָרִים, מֵאַיִן יָבֹא עֶזְרִי.
עֶזְרִי מֵעִם ה', עֹשֵׂה שָׁמַיִם וָאָרֶץ.
אַל יִתֵּן לַמּוֹט רַגְלֶךָ, אַל יָנוּם שֹׁמְרֶךָ.
הִנֵּה לֹא יָנוּם וְלֹא יִישָׁן, שׁוֹמֵר יִשְׂרָאֵל.
ה' שֹׁמְרֶךָ, ה' צִלְּךָ עַל יַד יְמִינֶךָ.
יוֹמָם הַשֶּׁמֶשׁ לֹא יַכֶּכָּה, וְיָרֵחַ בַּלָּיְלָה.
ה' יִשְׁמָרְךָ מִכָּל רָע, יִשְׁמֹר אֶת נַפְשֶׁךָ.
ה' יִשְׁמָר צֵאתְךָ וּבוֹאֶךָ, מֵעַתָּה וְעַד עוֹלָם.`;

const PSALM_124 = `שִׁיר הַמַּעֲלוֹת לְדָוִד, לוּלֵי ה' שֶׁהָיָה לָנוּ, יֹאמַר נָא יִשְׂרָאֵל.
לוּלֵי ה' שֶׁהָיָה לָנוּ, בְּקוּם עָלֵינוּ אָדָם.
אֲזַי חַיִּים בְּלָעוּנוּ, בַּחֲרוֹת אַפָּם בָּנוּ.
אֲזַי הַמַּיִם שְׁטָפוּנוּ, נַחְלָה עָבַר עַל נַפְשֵׁנוּ.
אֲזַי עָבַר עַל נַפְשֵׁנוּ, הַמַּיִם הַזֵּידוֹנִים.
בָּרוּךְ ה' שֶׁלֹּא נְתָנָנוּ טֶרֶף לְשִׁנֵּיהֶם.
נַפְשֵׁנוּ כְּצִפּוֹר נִמְלְטָה מִפַּח יוֹקְשִׁים, הַפַּח נִשְׁבָּר וַאֲנַחְנוּ נִמְלָטְנוּ.
עֶזְרֵנוּ בְּשֵׁם ה', עֹשֵׂה שָׁמַיִם וָאָרֶץ.`;

const PSALM_130 = `שִׁיר הַמַּעֲלוֹת, מִמַּעֲמַקִּים קְרָאתִיךָ ה'.
אֲדֹנָי שִׁמְעָה בְקוֹלִי, תִּהְיֶיןָ אָזְנֶיךָ קַשֻּׁבוֹת לְקוֹל תַּחֲנוּנָי.
אִם עֲוֹנוֹת תִּשְׁמָר יָהּ, אֲדֹנָי מִי יַעֲמֹד.
כִּי עִמְּךָ הַסְּלִיחָה, לְמַעַן תִּוָּרֵא.
קִוִּיתִי ה', קִוְּתָה נַפְשִׁי, וְלִדְבָרוֹ הוֹחָלְתִּי.
נַפְשִׁי לַאדֹנָי, מִשֹּׁמְרִים לַבֹּקֶר, שֹׁמְרִים לַבֹּקֶר.
יַחֵל יִשְׂרָאֵל אֶל ה', כִּי עִם ה' הַחֶסֶד, וְהַרְבֵּה עִמּוֹ פְדוּת.
וְהוּא יִפְדֶּה אֶת יִשְׂרָאֵל, מִכֹּל עֲוֹנֹתָיו.`;

const IGERET_RAMBAN = `שְׁמַע בְּנִי מוּסַר אָבִיךָ, וְאַל תִּטֹּשׁ תּוֹרַת אִמֶּךָ: תִּתְנַהֵג תָּמִיד לְדַבֵּר כָּל דְּבָרֶיךָ בְּנַחַת, לְכָל אָדָם וּבְכָל עֵת, וּבָזֶה תִּנָּצֵל מִן הַכַּעַס, שֶׁהִיא מִדָּה רָעָה לְהַחֲטִיא בְנֵי אָדָם. וְכֵן אָמְרוּ רַבּוֹתֵינוּ זִכְרוֹנָם לִבְרָכָה, "כָּל הַכּוֹעֵס כָּל מִינֵי גֵּיהִנָּם שׁוֹלְטִין בּוֹ", שֶׁנֶאֱמַר: הָסֵר כַּעַס מִלִּבֶּךָ, וְהַעֲבֵר רָעָה מִבְּשָׂרֶךָ, וְאֵין רָעָה אֶלָּא גֵהִנָּם, שֶׁנֶּאֱמַר: "וְגַם רָשָׁע לְיוֹם רָעָה".

וְכַאֲשֶׁר תִּנָּצֵל מִן הַכַּעַס, תַּעֲלֶה עַל לִבְּךָ מִדַּת הָעֲנָוָה שֶׁהִיא מִדָּה טוֹבָה מִכָּל הַמִּדּוֹת טוֹבוֹת, שֶׁנֶאֱמַר: עֵקֶב עֲנָוָה יִרְאַת ה'. וּבַעֲבוּר הָעֲנָוָה, תַּעֲלֶה עַל לִבְּךָ מִדַּת הַיִרְאָה, כִּי תִתֵּן אֶל לִבְּךָ תָּמִיד: מֵאַיִן בָּאתָ, וּלְאַן אַתָּה הוֹלֵךְ, וְשֶׁאַתָּה רִמָּה וְתוֹלֵעָה בְּחַיֶיךָ, וְאַף כִּי בְּמוֹתֶךָ, וְלִפְנֵי מִי אַתָּה עָתִיד לִתֵּן דִּין וְחֶשְׁבּוֹן, לִפְנֵי מֶלֶךְ הַכָּבוֹד. וְכַאֲשֶׁר תַּחֲשׁוֹב אֶת כָּל אֵלֶּה, תִּירָא מִבּוֹרַאֲךָ וְתִשָּׁמֵר מִן הַחֵטְא, וּבְמִדּוֹת הָאֵלֶּה תִּהְיֶה שָׂמֵחַ בְּחֶלְקֶךָ.

וְכַאֲשֶׁר תִּתְנַהֵג בְּמִדַּת הָעֲנָוָה לְהִתְבּוֹשֵׁשׁ מִכָּל אָדָם וּלְהִתְפַּחֵד מִמֶּנּוּ וּמִן הַחֵטְא, אָז תִּשְׁרֶה עָלֶיךָ רוּחַ הַשְּׁכִינָה, וְזִיו כְּבוֹדָהּ, וְחַיֵּי עוֹלָם הַבָּא. וְעַתָּה בְּנִי דַע וּרְאֵה, כִּי הַמִּתְגָּאֶה בְלִבּוֹ עַל הַבְּרִיוֹת, מוֹרֵד הוּא בְּמַלְכוּת שָׁמַיִם. וּבַמֶּה יִתְגָּאֶה לֵב הָאָדָם? אִם בְּעֹשֶׁר, ה' מוֹרִישׁ וּמַעֲשִׁיר, וְאִם בְּכָבוֹד, הֲלֹא לֵאלֹהִים הוּא, שֶׁנֶאֱמַר: וְהָעֹשֶׁר וְהַכָּבוֹד מִלְּפָנֶיךָ. לָכֵן הַשְׁפִּיל עַצְמְךָ וִינַשַּׂאֲךָ הַמָּקוֹם.

עַל כֵּן אֲפָרֵשׁ לְךָ אֵיךְ תִּתְנַהֵג בְּמִדַּת הָעֲנָוָה לָלֶכֶת בָּהּ תָּמִיד: כָּל דְּבָרֶיךָ יִהְיוּ בְּנַחַת, וְרֹאשְׁךָ כָּפוּף, וְעֵינֶיךָ יַבִּיטוּ לְמַטָּה לָאָרֶץ וְלִבְּךָ לְמַעְלָה, וְאַל תַּבִּיט בִּפְנֵי אָדָם בְּדַבֶּרְךָ עִמּוֹ, וְכָל אָדָם יִהְיֶה גָּדוֹל מִמְּךָ בְּעֵינֶיךָ, וְאִם חָכָם אוֹ עָשִׁיר הוּא — עָלֶיךָ לְכַבְּדוֹ, וְאִם רָשׁ הוּא, וְאַתָּה עָשִׁיר אוֹ חָכָם מִמֶּנּוּ — חֲשֹׁב בְּלִבְּךָ כִּי אַתָּה חַיָּב מִמֶּנּוּ וְהוּא זַכַּאי מִמְּךָ, שֶׁאִם הוּא חוֹטֵא הוּא שׁוֹגֵג וְאַתָּה מֵזִיד.

בְּכָל דְּבָרֶיךָ וּמַעֲשֶׂיךָ וּמַחְשְׁבוֹתֶיךָ וּבְכָל עֵת, חֲשֹׁב בְּלִבְּךָ כְּאִלּוּ אַתָּה עוֹמֵד לִפְנֵי הַקָּדוֹשׁ בָּרוּךְ הוּא, וּשְׁכִינָתוֹ עָלֶיךָ, כִּי כְּבוֹדוֹ מָלֵא הָעוֹלָם. וּדְבָרֶיךָ יִהְיוּ בְּאֵימָה וּבְיִרְאָה כְּעֶבֶד לִפְנֵי רַבּוֹ.

וֶהֱוֵי זָהִיר לִקְרוֹת בַּתּוֹרָה תָּמִיד אֲשֶׁר תּוּכַל לְקַיְּמָהּ. וְכַאֲשֶׁר תָּקוּם מִן הַסֵּפֶר, תְּחַפֵּשׂ בַּאֲשֶׁר לָמַדְּתָּ אִם יֵשׁ בּוֹ דָּבָר אֲשֶׁר תּוּכַל לְקַיְּמוֹ, וּתְפַשְׁפֵּשׁ בְּמַעֲשֶׂיךָ בַּבֹּקֶר וּבָעֶרֶב, וּבָזֶה יִהְיוּ כָּל יָמֶיךָ בִּתְשׁוּבָה. וְהָסֵר כָּל דִבְרֵי הָעוֹלָם מִלִּבְּךָ בְּעֵת הַתְּפִלָּה, וְהָכֵן לִבְּךָ לִפְנֵי הַמָּקוֹם בָּרוּךְ הוּא, וְטַהֵר רַעְיוֹנֶיךָ, וַחֲשֹׁב הַדִּבּוּר קֹדֶם שֶׁתּוֹצִיאֶנּוּ מִפִּיךָ.

תִּקְרָא הָאִגֶּרֶת הַזֹּאת פַּעַם אַחַת בַּשָּׁבוּעַ וְלֹא תִפְחוֹת, לְקַיְּמָהּ וְלָלֶכֶת בָּהּ תָּמִיד אַחַר הַשֵּׁם יִתְבָּרַךְ, לְמַעַן תַּצְלִיחַ בְּכָל דְּרָכֶיךָ וְתִזְכֶּה לָעוֹלָם הַבָּא הַצָּפוּן לַצַּדִּיקִים. וּבְכָל יוֹם שֶׁתִּקְרָאֶנָּה יַעֲנוּךָ מִן הַשָּׁמַיִם כַּאֲשֶׁר יַעֲלֶה עַל לִבְּךָ לִשְׁאוֹל עַד עוֹלָם אָמֵן סֶלָה.`;

// ─── Prayer definitions per nusach ───────────────────────────────────────────

interface PrayerSection {
  id: string;
  title: string;
  subtitle: string;
  text?: string;
  images?: string[];
  group?: string; // items with the same group render together in a row/grid
}

function getPrayers(nusach: Nusach): PrayerSection[] {
  const kaddishSubtitle =
    nusach === "ashkenaz"
      ? "נוסח אשכנז"
      : nusach === "mizrahi"
        ? "נוסח עדות המזרח"
        : "נוסח ספרד";

  const prayers: PrayerSection[] = [
    {
      id: "kaddish",
      title: "קדיש יתום",
      subtitle: kaddishSubtitle,
      text: nusach === "mizrahi" ? KADDISH_MIZRAHI : KADDISH,
    },
  ];

  if (nusach === "ashkenaz") {
    prayers.push(
      {
        id: "el-maleh-ish",
        title: "אל מלא רחמים לגבר",
        subtitle: "החלף [שם הנפטר] ו[שם אמו]",
        text: EL_MALEH_ISH,
        group: "el-maleh",
      },
      {
        id: "el-maleh-isha",
        title: "אל מלא רחמים לאשה",
        subtitle: "החלף [שם הנפטרת] ו[שם אמה]",
        text: EL_MALEH_ISHA,
        group: "el-maleh",
      }
    );
  } else {
    prayers.push(
      {
        id: "hashkava-ish",
        title: "אשכבה לגבר",
        subtitle: "החלף [שם הנפטר] ו[שם האב]",
        text: HASHKAVA_ISH,
        group: "hashkava",
      },
      {
        id: "hashkava-isha",
        title: "אשכבה לאשה",
        subtitle: "החלף [שם הנפטרת] ו[שם האב]",
        text: HASHKAVA_ISHA,
        group: "hashkava",
      }
    );
  }

  // Image-based prayers — Mizrahi nusach
  if (nusach === "mizrahi") {
    prayers.push(
      {
        id: "soldier-prayer",
        title: "מי שברך — תפילה לשלום החיילים",
        subtitle: "נוסח עדות המזרח",
        images: ["/prayers/soldier.jpeg"],
      },
      {
        id: "sick-man",
        title: "תפילה לרפואת איש",
        subtitle: "החלף בשם החולה",
        images: ["/prayers/sick-man-1.jpeg", "/prayers/sick-man-2.jpeg"],
        group: "refua",
      },
      {
        id: "sick-woman",
        title: "תפילה לרפואת אשה",
        subtitle: "החלף בשם החולה",
        images: ["/prayers/sick-woman.jpeg"],
        group: "refua",
      }
    );
  }

  // Psalms — all nusach
  prayers.push(
    { id: "psalm-91",  title: "תהלים פרק צא",  subtitle: "יֹשֵׁב בְּסֵתֶר עֶלְיוֹן",       text: PSALM_91,  group: "psalms" },
    { id: "psalm-121", title: "תהלים פרק קכא", subtitle: "שִׁיר לַמַּעֲלוֹת — אֶשָּׂא עֵינַי", text: PSALM_121, group: "psalms" },
    { id: "psalm-124", title: "תהלים פרק קכד", subtitle: "שִׁיר הַמַּעֲלוֹת לְדָוִד",       text: PSALM_124, group: "psalms" },
    { id: "psalm-130", title: "תהלים פרק קל",  subtitle: "מִמַּעֲמַקִּים קְרָאתִיךָ",        text: PSALM_130, group: "psalms" },
    { id: "igeret-ramban", title: "אגרת הרמב\"ן", subtitle: "שְׁמַע בְּנִי מוּסַר אָבִיךָ", text: IGERET_RAMBAN },
  );

  return prayers;
}

// ─── Component ────────────────────────────────────────────────────────────────

const NUSACH_OPTIONS: { value: Nusach; label: string }[] = [
  { value: "sephardi", label: "ספרד" },
  { value: "mizrahi", label: "מזרח" },
  { value: "ashkenaz", label: "אשכנז" },
];

interface Props {
  defaultNusach: Nusach;
  locale: string;
}

export function PrayersClient({ defaultNusach, locale }: Props) {
  const [nusach, setNusach] = useState<Nusach>(defaultNusach);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const prayers = getPrayers(nusach);

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>תפילות</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>קדיש, אשכבה, תהילים ותפילות שונות</p>
        <div className="h-px mt-3" style={{ background: "linear-gradient(to right, transparent, #c9a84c40, transparent)" }} />
      </div>

      {/* Nusach selector */}
      <div className="mb-5 p-1 rounded-xl flex gap-1" style={{ background: "var(--muted)" }}>
        {NUSACH_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setNusach(opt.value);
              setOpenId(null);
            }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={
              nusach === opt.value
                ? {
                    background: "linear-gradient(135deg, #c9a84c, #8b6010)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(184,134,11,0.30)",
                  }
                : { color: "var(--muted-foreground)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Prayer cards */}
      <div className="space-y-3 mb-5">
        {(() => {
          // Group consecutive same-group prayers into sections
          type RenderSection = { group: string | null; items: PrayerSection[] };
          const sections: RenderSection[] = [];
          for (const p of prayers) {
            const last = sections[sections.length - 1];
            if (last && last.group !== null && last.group === p.group) {
              last.items.push(p);
            } else {
              sections.push({ group: p.group ?? null, items: [p] });
            }
          }

          // Shared: render the open content of a prayer
          function PrayerContent({ prayer }: { prayer: PrayerSection }) {
            return (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <div className="p-4">
                  {prayer.images ? (
                    <div className="space-y-3">
                      {prayer.images.map((src, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={idx} src={src} alt={prayer.title} className="w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <pre className="text-base leading-loose whitespace-pre-wrap font-sans text-right"
                      style={{ color: "var(--foreground)", direction: "rtl" }}>
                      {prayer.text}
                    </pre>
                  )}
                </div>
                {!prayer.images && prayer.text && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleCopy(prayer.id, prayer.text!)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={copied === prayer.id
                        ? { background: "linear-gradient(135deg, #86efac, #4ade80)", color: "#14532d" }
                        : { background: "linear-gradient(135deg, #c9a84c22, #c9a84c11)", color: "var(--primary)", border: "1px solid #c9a84c40" }}
                    >
                      {copied === prayer.id ? (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>הועתק!</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>העתק תפילה</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return sections.map((section, si) => {
            // ── Single prayer (no group) ─────────────────────────────────────
            if (section.group === null || section.items.length === 1) {
              const prayer = section.items[0];
              const isOpen = openId === prayer.id;
              return (
                <div key={prayer.id} style={cardStyle}>
                  <button
                    className="w-full flex items-center justify-between p-4 text-right"
                    onClick={() => setOpenId(isOpen ? null : prayer.id)}
                  >
                    <div className="flex-1 text-right">
                      <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{prayer.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{prayer.subtitle}</p>
                    </div>
                    <svg className={`w-4 h-4 shrink-0 ms-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && <PrayerContent prayer={prayer} />}
                </div>
              );
            }

            // ── Psalms group — 2×2 grid ──────────────────────────────────────
            if (section.group === "psalms") {
              const openPrayer = section.items.find(p => openId === p.id);
              return (
                <div key={`section-psalms-${si}`}>
                  <div style={cardStyle}>
                    <div className="grid grid-cols-2">
                      {section.items.map((prayer, idx) => {
                        const isOpen = openId === prayer.id;
                        const borderB = idx < 2 ? "1px solid var(--border)" : undefined;
                        const borderL = idx % 2 === 0 ? "1px solid var(--border)" : undefined;
                        return (
                          <button
                            key={prayer.id}
                            onClick={() => setOpenId(isOpen ? null : prayer.id)}
                            className="p-3 text-right transition-all"
                            style={{
                              borderBottom: borderB,
                              borderLeft: borderL,
                              background: isOpen ? "linear-gradient(135deg, #fff8e8, #fef3d0)" : undefined,
                            }}
                          >
                            <p className="font-bold text-xs" style={{ color: isOpen ? "#8b6010" : "var(--foreground)" }}>{prayer.title}</p>
                            <p className="text-xs mt-0.5 leading-tight" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>{prayer.subtitle}</p>
                          </button>
                        );
                      })}
                    </div>
                    {openPrayer && <PrayerContent prayer={openPrayer} />}
                  </div>
                  {/* Psalm books link — shown below the psalms group */}
                  <div className="mt-3 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #fff8e8, #fef3d0)", border: "1px solid #c9a84c50" }}>
                    <p className="font-bold text-xs mb-2" style={{ color: "#8b6010" }}>ספרי תהילים דיגיטליים</p>
                    <div className="flex flex-col gap-2">
                      <a href="https://tehilim.co/neshama/" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                        style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        תהילים אותיות נשמה
                      </a>
                      <a href="https://www.mgketer.org/mikra/27" target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        ספר תהילים מלא — מקראות גדולות
                      </a>
                    </div>
                  </div>
                </div>
              );
            }

            // ── Pair group (hashkava / el-maleh / refua) — 2 buttons in a row ──
            const openPrayer = section.items.find(p => openId === p.id);
            return (
              <div key={`section-${section.group}-${si}`} style={cardStyle}>
                <div className="grid grid-cols-2">
                  {section.items.map((prayer, idx) => {
                    const isOpen = openId === prayer.id;
                    return (
                      <button
                        key={prayer.id}
                        onClick={() => setOpenId(isOpen ? null : prayer.id)}
                        className="flex items-center justify-between p-4 text-right transition-all"
                        style={{
                          borderLeft: idx === 0 ? "1px solid var(--border)" : undefined,
                          background: isOpen ? "linear-gradient(135deg, #fff8e8, #fef3d0)" : undefined,
                        }}
                      >
                        <div className="flex-1 text-right">
                          <p className="font-bold text-sm" style={{ color: isOpen ? "#8b6010" : "var(--foreground)" }}>{prayer.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontSize: "0.65rem" }}>{prayer.subtitle}</p>
                        </div>
                        <svg className={`w-4 h-4 shrink-0 ms-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                {openPrayer && <PrayerContent prayer={openPrayer} />}
              </div>
            );
          });
        })()}
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Daily prayer times */}
        <a
          href="https://calendar.2net.co.il/TodayTimes.aspx?city=%D7%91%D7%99%D7%AA+%D7%99%D7%95%D7%A1%D7%A3"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
            border: "1px solid #c9a84c50",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-xs" style={{ color: "#8b6010" }}>זמני תפילה</p>
            <p className="text-xs mt-0.5" style={{ color: "#b8860b" }}>שעות היום</p>
          </div>
        </a>

        {/* Holidays link */}
        <Link
          href={`/${locale}/prayers/holidays`}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
            border: "1px solid #c9a84c50",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-bold text-xs" style={{ color: "#8b6010" }}>חגים ומועדים</p>
            <p className="text-xs mt-0.5" style={{ color: "#b8860b" }}>יזכור ואבלות</p>
          </div>
        </Link>
      </div>

      {/* External prayers link */}
      <div
        className="p-4 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #fff8e8, #fef3d0)",
          border: "1px solid #c9a84c50",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1" style={{ color: "#b8860b" }}>נוסחי תפילה נוספים</p>
            <p className="text-xs mb-3" style={{ color: "#8b6a4f" }}>
              אתר חברה קדישא מציע נוסחי תפילות לפי שם ולפי מנהג
            </p>
            <a
              href="https://www.kadisha.org/prayers-by-name/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #c9a84c, #8b6010)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              פתח אתר חברה קדישא
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
