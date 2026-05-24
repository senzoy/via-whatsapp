import { Bot } from "../../core/core.js";
export function Album(ctx) {
    Bot.sendMessage({
        msg: ctx.msg,
        jid: ctx.jid,
        content: `
*MAXNINI - PERFIL*
*Usa Mex Can 26*
*Necesito*
FWC 🏆: 3
FWC 🌎: 5, 6, 8
MEX 🇲🇽: 3, 7, 11
KOR 🇰🇷: 7, 8, 11, 12, 15, 16, 17, 20
CZE 🇨🇿: 10, 11, 13
BIH 🇧🇦: 11, 14
QAT 🇶🇦: 4
SUI 🇨🇭: 16
MAR 🇲🇦: 3, 7, 11, 13, 14
HAI 🇭🇹: 1, 6
SCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿: 4, 5, 11, 12, 15, 16, 17, 18, 20
USA 🇺🇸: 3, 4, 12, 19
PAR 🇵🇾: 3, 9, 14
TUR 🇹🇷: 1, 6, 13, 19
GER 🇩🇪: 1, 3, 4, 11, 12, 17, 20
CUW 🇨🇼: 6, 7, 11, 15, 16, 19
CIV 🇨🇮: 18
ECU 🇪🇨: 9, 14, 15, 18, 19
NED 🇳🇱: 3, 7, 16
JPN 🇯🇵: 9, 13, 14, 18
SWE 🇸🇪: 9, 13, 14, 17, 19
TUN 🇹🇳: 5
EGY 🇪🇬: 1, 3, 15
NZL 🇳🇿: 9, 18
ESP 🇪🇸: 3
KSA 🇸🇦: 3, 6
URU 🇺🇾: 17, 18
FRA 🇫🇷: 18
SEN 🇸🇳: 1, 11
IRQ 🇮🇶: 8, 10, 15, 17
NOR 🇳🇴: 8, 17
ARG 🇦🇷: 13
ALG 🇩🇿: 1, 6, 19
JOR 🇯🇴: 18
POR 🇵🇹: 3, 19
COD 🇨🇩: 13, 19, 20
UZB 🇺🇿: 8, 17
COL 🇨🇴: 1, 2, 3, 6, 7
ENG 🏴󠁧󠁢󠁥󠁮󠁧󠁿: 1, 18
CRO 🇭🇷: 13
GHA 🇬🇭: 2, 5, 9, 10, 12, 14, 18
PAN 🇵🇦: 5, 9, 14, 18`,
        reply: true,
        delay: 1500
    });
}
