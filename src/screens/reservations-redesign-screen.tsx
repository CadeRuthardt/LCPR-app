import { router, useFocusEffect } from "expo-router";
import * as React from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import { AppCard, BrandHeader, EmptyState, ErrorState, LoadingSkeleton } from "@/components/app";
import { Icon, Screen, Text } from "@/components/primitives";
import {
  cancelReservationRequest,
  getCachedClientDashboardData,
  getCurrentClientDashboardData,
} from "@/services/client-data";
import {
  getCachedReservationDisplayTotals,
  preloadReservationDisplayData,
} from "@/services/reservation-display-data";
import { colors, fonts, radii, spacing, typography } from "@/theme";
import type { ClientReservation, Pet } from "@/types/app";
import type { ReservationRequest } from "@/types/database";

type State = { pastReservations: ClientReservation[]; pets: Pet[]; requests: ReservationRequest[]; upcomingReservations: ClientReservation[] };
export function ReservationsRedesignScreen() {
  const cached = getCachedClientDashboardData(); const cachedTotals = getCachedReservationDisplayTotals(); const [tab, setTab] = React.useState<"Upcoming"|"Past">("Upcoming");
  const [data,setData]=React.useState<State>({ pastReservations:cached?.pastReservations??[], pets:cached?.pets??[], requests:cached?.requests??[], upcomingReservations:cached?.upcomingReservations??[] });
  const [reservationTotals,setReservationTotals]=React.useState<Record<string,string>>(cachedTotals?.upcoming??{});
  const [reservationTotalsLoading,setReservationTotalsLoading]=React.useState(!cachedTotals&&(cached?.upcomingReservations.length??0)>0);
  const [invoiceTotals,setInvoiceTotals]=React.useState<Record<string,string>>(cachedTotals?.past??{});
  const [invoiceTotalsLoading,setInvoiceTotalsLoading]=React.useState(!cachedTotals&&(cached?.pastReservations.some((reservation)=>!reservation.status.toLowerCase().includes("cancel"))??false));
  const [loading,setLoading]=React.useState(!cached); const [error,setError]=React.useState<string|null>(null);
  const [cancellingRequestId,setCancellingRequestId]=React.useState<string|null>(null);
  const load=React.useCallback(()=>{setError(null);void getCurrentClientDashboardData().then((next)=>{
    setData(next);
    setReservationTotalsLoading(next.upcomingReservations.length>0);
    setInvoiceTotalsLoading(next.pastReservations.some((reservation)=>!reservation.status.toLowerCase().includes("cancel")));
    void preloadReservationDisplayData(next)
      .then((totals)=>{setReservationTotals(totals.upcoming);setInvoiceTotals(totals.past);})
      .catch(()=>{setReservationTotals({});setInvoiceTotals({});})
      .finally(()=>{setReservationTotalsLoading(false);setInvoiceTotalsLoading(false);});
  }).catch(()=>setError("We couldn’t refresh your reservations." )).finally(()=>setLoading(false));},[]); useFocusEffect(load);
  const confirmRequestCancellation=React.useCallback((request:ReservationRequest)=>{
    Alert.alert(
      "Cancel reservation request?",
      "This request has not been confirmed yet. Cancelling it will remove it from your upcoming requests.",
      [
        {style:"cancel",text:"Keep Request"},
        {
          onPress:()=>{
            setCancellingRequestId(request.id);
            void cancelReservationRequest(request.id)
              .then((cancelledRequest)=>{
                setData((current)=>({
                  ...current,
                  requests:current.requests.map((item)=>item.id===cancelledRequest.id?cancelledRequest:item),
                }));
              })
              .catch(()=>{
                Alert.alert("Unable to cancel request","We couldn’t cancel this request. Please try again.");
              })
              .finally(()=>setCancellingRequestId(null));
          },
          style:"destructive",
          text:"Cancel Request",
        },
      ],
    );
  },[]);
  const petsById=new Map(data.pets.map((pet)=>[pet.id,pet])); const petsByName=new Map(data.pets.map((pet)=>[pet.name.trim().toLowerCase(),pet]));
  const upcomingRequests=data.requests.filter((request)=>["submitted","under_review","action_required"].includes(request.status));
  const completedPastReservations=data.pastReservations.filter((reservation)=>!isCancelledReservation(reservation));
  return <View style={styles.root}><BrandHeader/><Screen contentStyle={styles.content} onRefresh={load} refreshing={false} topSafeArea={false}>
    <View style={styles.heading}><View style={styles.headingCopy}><Text style={typography.screenTitle}>Reservations</Text><Text style={typography.bodySecondary}>Upcoming and past stays for your pets.</Text></View><Pressable onPress={()=>router.push("/request-reservation")} style={styles.newRequest}><View style={styles.plus}><Icon color={colors.textInverse} name="plus" size={19}/></View><Text style={styles.newRequestText}>New Request</Text></Pressable></View>
    <View style={styles.tabs}>{(["Upcoming","Past"] as const).map((item)=><Pressable key={item} onPress={()=>setTab(item)} style={[styles.tab,tab===item&&styles.tabActive]}><Text style={[styles.tabText,tab===item&&styles.tabTextActive]}>{item}</Text></Pressable>)}</View>
    {loading?<><LoadingSkeleton/><LoadingSkeleton/></>:error?<ErrorState message={error} onRetry={load}/>:tab==="Upcoming"?<View style={styles.list}><Text style={styles.listLabel}>UPCOMING REQUESTS</Text>{upcomingRequests.map((request)=><RequestRow cancelling={cancellingRequestId===request.id} key={request.id} onCancel={()=>confirmRequestCancellation(request)} request={request} pets={request.selected_pet_ids.map((id)=>petsById.get(id)).filter((pet):pet is Pet=>Boolean(pet))}/>)}{data.upcomingReservations.map((reservation)=><StayRow key={reservation.id} reservation={reservation} pets={reservation.petNames.map((name)=>petsByName.get(name.trim().toLowerCase())).filter((pet):pet is Pet=>Boolean(pet))} total={reservationTotals[reservation.id]} totalLoading={reservationTotalsLoading}/>)}{upcomingRequests.length+data.upcomingReservations.length===0?<EmptyState icon="calendar" title="No upcoming stays" body="Confirmed reservations and requests will appear here." actionLabel="New Request" onAction={()=>router.push("/request-reservation")}/>:null}</View>:<View style={styles.list}><Text style={styles.listLabel}>PAST STAYS</Text>{completedPastReservations.map((reservation)=><StayRow key={reservation.id} reservation={reservation} pets={reservation.petNames.map((name)=>petsByName.get(name.trim().toLowerCase())).filter((pet):pet is Pet=>Boolean(pet))} total={invoiceTotals[reservation.id]} totalLoading={invoiceTotalsLoading} past/>)}{completedPastReservations.length===0?<EmptyState icon="calendar" title="No past stays" body="Completed stays will appear here."/>:null}</View>}
  </Screen></View>;
}
function RequestRow({
  cancelling,
  onCancel,
  pets,
  request,
}: {
  cancelling: boolean;
  onCancel: () => void;
  pets: Pet[];
  request: ReservationRequest;
}) {
  const pet = pets[0];
  const status = request.status === "action_required" ? "Payment Required" : "Pending Confirmation";

  return (
    <AppCard style={styles.card}>
      <View style={styles.statusRow}>
        <View style={styles.pendingBadge}>
          <Icon color={colors.warning} name="clock" size={12} />
          <Text style={styles.pendingText}>{status}</Text>
        </View>
        <Pressable
          accessibilityLabel="Cancel reservation request"
          accessibilityRole="button"
          disabled={cancelling}
          hitSlop={6}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancelRequestButton,
            pressed && styles.cancelRequestButtonPressed,
            cancelling && styles.cancelRequestButtonDisabled,
          ]}
        >
          <Icon color={colors.error} name="x" size={12} />
          <Text style={styles.cancelRequestText}>{cancelling ? "Cancelling…" : "Cancel request"}</Text>
        </Pressable>
      </View>
      <View style={styles.cardMain}>
        {pet ? <Image source={{ uri: pet.imageUrl }} style={styles.petImage} /> : <View style={styles.petImage} />}
        <View style={styles.cardCopy}>
          <Text style={styles.petName}>{pet?.name ?? "Your pet"}</Text>
          <Meta icon="paw" text={pet?.breed ?? request.experience} />
          <Meta icon="calendar" text={`${formatDate(request.start_date)} – ${formatDate(request.end_date)} (${nightCount(request.start_date, request.end_date)})`} />
          <Meta icon="info" text={request.location ?? "Location pending"} />
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Estimate</Text>
          <Text style={styles.pricePending}>Pending</Text>
        </View>
      </View>
      <View style={styles.notice}>
        <Icon color={colors.warning} name="info" size={14} />
        <Text style={styles.noticeText}>We’ll confirm availability and final pricing soon.</Text>
      </View>
    </AppCard>
  );
}
function StayRow({past,pets,reservation,total,totalLoading}:{past?:boolean;pets:Pet[];reservation:ClientReservation;total?:string;totalLoading?:boolean}){
  const isCancelled=reservation.status.trim().toLowerCase().includes("cancel");
  const isCombined=reservation.petNames.length>1;
  const breedLabel=isCombined?`${reservation.petNames.length} pets · ${reservation.reservationType??"Reservation"}`:pets[0]?.breed??reservation.reservationType??"Reservation";
  const badgeStyle=isCancelled?styles.cancelledBadge:past?styles.pastBadge:styles.confirmedBadge;
  const badgeTextStyle=isCancelled?styles.cancelledText:past?styles.pastText:styles.confirmedText;
  const badgeColor=isCancelled?colors.error:past?colors.textSecondary:colors.success;
  const badgeLabel=isCancelled?"Cancelled":past?"Completed":"Confirmed";
  const noticeStyle=isCancelled?styles.noticeCancelled:past?styles.noticePast:styles.noticeConfirmed;
  const petNames=reservation.petNames.join(" & ")||"your pet";
  const noticeText=isCancelled?"This reservation was cancelled.":past?"Thanks for staying with us.":`Your stay is confirmed. We can’t wait to see ${petNames}!`;
  return <Pressable onPress={()=>router.push({pathname:"/reservation-detail",params:{reservationIds:reservation.id}})}><AppCard style={styles.card}><View style={styles.statusRow}><View style={badgeStyle}><Icon color={badgeColor} name={isCancelled?"x":"check"} size={12}/><Text style={badgeTextStyle}>{badgeLabel}</Text></View><Icon color={colors.burgundy} name="chevron-right" size={18}/></View><View style={styles.cardMain}><PetImages pets={pets}/><View style={styles.cardCopy}><Text numberOfLines={2} style={styles.petName}>{reservation.petNames.join(" & ")}</Text><Meta icon="paw" text={breedLabel}/><Meta icon="calendar" text={`${reservation.dateRange} (${nightCount(reservation.startDate,reservation.endDate)})`}/><Meta icon="info" text={reservation.location??"Location pending"}/></View>{isCancelled?null:<View style={styles.priceBox}><Text style={styles.priceLabel}>{past?"Invoice Total":"Estimate"}</Text><Text style={total?styles.priceValue:styles.pricePending}>{total??(totalLoading?"Loading…":past?"Unavailable":"Pending")}</Text></View>}</View><View style={[styles.notice,noticeStyle]}><Icon color={badgeColor} name={isCancelled?"x":"check"} size={14}/><Text style={styles.noticeText}>{noticeText}</Text></View></AppCard></Pressable>
}
function PetImages({pets}:{pets:Pet[]}){if(pets.length===0)return <View style={styles.petImage}/>;return <View style={styles.petImages}>{pets.slice(0,3).map((pet,index)=><Image key={pet.id} source={{uri:pet.imageUrl}} style={[styles.petImage,index>0&&styles.petImageOverlap]}/>)}</View>}
function Meta({icon,text}:{icon:"paw"|"calendar"|"info";text:string}){return <View style={styles.meta}><Icon color={colors.textMuted} name={icon} size={12}/><Text numberOfLines={2} style={styles.metaText}>{text}</Text></View>}
function isCancelledReservation(reservation:ClientReservation){return reservation.status.trim().toLowerCase().includes("cancel")}
function formatDate(value:string|null){if(!value)return"Pending";const [y,m,d]=value.split("-").map(Number);return new Date(y,m-1,d).toLocaleDateString(undefined,{month:"short",day:"numeric"})}
function nightCount(start:string|null,end:string|null){if(!start||!end)return"dates pending";const count=Math.max(1,Math.round((new Date(end).getTime()-new Date(start).getTime())/86400000));return`${count}\u00a0night${count===1?"":"s"}`}
const styles=StyleSheet.create({cancelRequestButton:{alignItems:"center",borderColor:colors.error,borderRadius:8,borderWidth:1,flexDirection:"row",gap:4,minHeight:28,paddingHorizontal:8},cancelRequestButtonDisabled:{opacity:0.5},cancelRequestButtonPressed:{backgroundColor:colors.errorSoft},cancelRequestText:{color:colors.error,fontFamily:fonts.bodyMedium,fontSize:9},root:{backgroundColor:colors.background,flex:1},content:{gap:spacing[16],paddingTop:spacing[14]},heading:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},headingCopy:{gap:2},newRequest:{alignItems:"center",gap:4},plus:{alignItems:"center",backgroundColor:colors.burgundy,borderRadius:20,height:40,justifyContent:"center",width:40},newRequestText:{color:colors.burgundy,fontFamily:fonts.bodySemiBold,fontSize:10},tabs:{borderBottomColor:colors.divider,borderBottomWidth:1,flexDirection:"row"},tab:{alignItems:"center",flex:1,minHeight:44,justifyContent:"center"},tabActive:{borderBottomColor:colors.burgundy,borderBottomWidth:3},tabText:{color:colors.textSecondary,fontSize:13},tabTextActive:{color:colors.burgundy,fontFamily:fonts.bodySemiBold},list:{gap:spacing[10]},listLabel:{color:colors.textSecondary,fontFamily:fonts.bodySemiBold,fontSize:10},card:{gap:spacing[10],padding:spacing[10]},statusRow:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},pendingBadge:{alignItems:"center",backgroundColor:colors.warningSoft,borderRadius:8,flexDirection:"row",gap:4,paddingHorizontal:8,paddingVertical:4},pendingText:{color:colors.warning,fontSize:10},confirmedBadge:{alignItems:"center",backgroundColor:colors.successSoft,borderRadius:8,flexDirection:"row",gap:4,paddingHorizontal:8,paddingVertical:4},confirmedText:{color:colors.success,fontSize:10},pastBadge:{alignItems:"center",backgroundColor:colors.surfaceMuted,borderRadius:8,flexDirection:"row",gap:4,paddingHorizontal:8,paddingVertical:4},pastText:{color:colors.textSecondary,fontSize:10},cancelledBadge:{alignItems:"center",backgroundColor:colors.errorSoft,borderRadius:8,flexDirection:"row",gap:4,paddingHorizontal:8,paddingVertical:4},cancelledText:{color:colors.error,fontSize:10},cardMain:{alignItems:"center",flexDirection:"row",gap:spacing[10]},petImages:{alignItems:"center",flexDirection:"row",width:62},petImage:{backgroundColor:colors.surfaceMuted,borderColor:colors.surface,borderRadius:radii.circle,borderWidth:2,height:48,width:48},petImageOverlap:{marginLeft:-34},cardCopy:{flex:1,gap:2,minWidth:0},petName:{fontFamily:fonts.bodySemiBold,fontSize:14,lineHeight:18},meta:{alignItems:"flex-start",flexDirection:"row",gap:5},metaText:{color:colors.textSecondary,flexShrink:1,fontSize:10,lineHeight:14},priceBox:{alignItems:"center",backgroundColor:colors.surfaceWarm,borderRadius:10,flexShrink:0,gap:2,justifyContent:"center",minHeight:70,padding:8,width:82},priceLabel:{color:colors.textSecondary,fontSize:9},priceValue:{color:colors.burgundy,fontFamily:fonts.bodySemiBold,fontSize:15},pricePending:{color:colors.textMuted,fontSize:11},notice:{alignItems:"center",backgroundColor:colors.warningSoft,borderRadius:7,flexDirection:"row",gap:7,paddingHorizontal:8,paddingVertical:7},noticeCancelled:{backgroundColor:colors.errorSoft},noticeConfirmed:{backgroundColor:colors.successSoft},noticePast:{backgroundColor:colors.surfaceMuted},noticeText:{color:colors.textSecondary,fontSize:9}});
