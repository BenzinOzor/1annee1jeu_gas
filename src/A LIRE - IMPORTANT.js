/* **********************************************************************************
*  Merci de me (Benzine) prévenir si vous voulez faire des modifications dans les scripts.
*  Je suis ouvert à la discussion, l'amélioration et la mise à jour du code mais ne le faites pas dans votre coin svp.
*
*  L'historique des scripts ne marche pas, donc pour éviter les soucis et garder trace des versions du code, je push ce que je fais sur un repo git
*  Faire des modifications sans me prévenir pourrait donnera lieu à la disparition de vos modifications lorsque je mettrai le code à jour depuis mon PC
*
*  Je me doute que tout n'est pas clean dans ce que j'ai fait et je vais essayer d'améliorer tout ça donc n'hésitez pas à faire des retours.
*
*  Merci d'avoir lu ♥
* **********************************************************************************/

function test()
{
	let dur1 = new Duration( "2:00:59" );
	let dur2 = new Duration( "5:00:10" );
	let dur3 = new Duration( "0:00:25" );
	let dur4 = new Duration( "-10:00:01" );

	Logger.log( Duration.compare( dur1, dur2 ) + ' ' + Duration.compare( dur2, dur3 ) + ' ' + Duration.compare( dur2, dur4, true ) + ' ' + Duration.compare( dur4, dur4 ) );
}